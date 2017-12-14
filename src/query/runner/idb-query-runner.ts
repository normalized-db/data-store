import { ISchema, isNull, NotFoundError, ValidKey } from '@normalized-db/core';
import { IDenormalizer } from '@normalized-db/denormalizer';
import { Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context';
import { InvalidQueryConfigError, InvalidQueryRunnerStatusError } from '../../error';
import { ListResult, ListResultBuilder } from '../list-result';
import { QueryConfig } from '../query-config';
import { QueryRunner } from './query-runner';

export class IdbQueryRunner<Result> implements QueryRunner<Result> {

  private readonly _schema: ISchema;

  private isRunning = false;
  private transaction: Transaction;
  private denormalizer: IDenormalizer;

  constructor(private readonly _context: IdbContext<any>,
              private readonly _config: QueryConfig) {
    this.fetchCallback = this.fetchCallback.bind(this);
    this._schema = this._context.schema();
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<number>}
   * @throws {InvalidQueryRunnerStatusError}
   */
  public async count(): Promise<number> {
    this.start();
    const result = await (await this._context.read(this._config.type)).objectStore(this._config.type).count();
    this.stop();
    return result;
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<ListResult<Result>>}
   * @throws {InvalidQueryRunnerStatusError}
   */
  public async execute(): Promise<ListResult<Result>> {
    this.start();
    let result: ListResult<Result>;
    if (this._config.parent) {
      result = (await this.findInParent()) as ListResult<Result>;
    } else if (this._config.keys) {
      result = await this.findAllByKeys(this._config.keys);
    } else {
      if (this._config.singleItem) {
        console.warn(
          'The query configuration has a key for a single-item-query but is run as list-query. The key will be ignored');
      }

      result = await this.findAll();
    }

    this.stop();
    return result;
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<Result>}
   * @throws {InvalidQueryRunnerStatusError}
   */
  public async singleExecute(): Promise<Result> {
    this.start();
    if (!this._config.singleItem) {
      throw new InvalidQueryConfigError('Primary key for `singleExecute` is missing');
    }

    let result: Result;
    if (this._config.parent) {
      result = (await this.findInParent()) as Result;
    } else {
      result = await this.findByKey();
    }

    this.stop();
    return result;
  }

  /**
   * Find all items of a given type. Paging and filter will be applied as defined in the query-config.
   *
   * @param {string} type
   * @returns {Promise<ListResult<Result>>}
   */
  private async findAll(type = this._config.type): Promise<ListResult<Result>> {
    if (!this.transaction) {
      this.transaction = await this._context.read(type);
    }

    const objectStore = this.transaction.objectStore(type);
    const hasRange = this._config.offset > 0 || this._config.limit < Infinity;
    const hasFilter = !!this._config.filter;

    if (!hasRange && !hasFilter) {
      const data = await objectStore.getAll();
      const denormalizedData = await this.denormalizer.applyAll<Result>(type, data, this._config.depth);
      return this.listResponse(denormalizedData, data.length);
    } else {
      const items = [];
      let index = 0;
      let cursor = await objectStore.openCursor();
      while (cursor && items.length < this._config.limit) {
        let denormalizedData, isValid = true;
        if (hasFilter) {
          if (this._config.filter.requiresNormalization) {
            denormalizedData = await this.denormalizer.apply<Result>(type, cursor.value, this._config.depth);
            isValid = this._config.filter.test(denormalizedData);
          } else {
            isValid = this._config.filter.test(cursor.value);
          }
        }

        if (isValid) {
          if (index >= this._config.offset && items.length < this._config.limit) {
            if (!denormalizedData) {
              denormalizedData = await this.denormalizer.apply<Result>(type, cursor.value, this._config.depth);
            }

            items.push(denormalizedData);
          }

          index++;
        }

        cursor = await cursor.continue();
      }

      return this.listResponse(items, items.length);
    }
  }

  /**
   * Find all items pre-filtered by their primary key. Paging and further filtering will be applied as defined
   * in the query-config.
   *
   * @param {ValidKey[]} keys
   * @param {string} type
   * @returns {Promise<ListResult<Result>>}
   */
  private async findAllByKeys(keys: ValidKey[], type = this._config.type): Promise<ListResult<Result>> {
    if (!this.transaction) {
      this.transaction = await this._context.read(type);
    }

    const objectStore = this.transaction.objectStore(type);
    const items = [];
    let keyIndex = 0, resultIndex = 0;
    while (keyIndex < keys.length && items.length < this._config.limit) {
      const key = keys[keyIndex];
      if (isNull(key)) {
        keyIndex++;
        continue;
      }

      const item = await objectStore.get(key);
      if (isNull(item)) {
        keyIndex++;
        continue;
      }

      let denormalizedData, isValid = true;
      if (this._config.filter) {
        if (this._config.filter.requiresNormalization) {
          denormalizedData = await this.denormalizer.apply<Result>(type, item, this._config.depth);
          isValid = this._config.filter.test(denormalizedData);
        } else {
          isValid = this._config.filter.test(item);
        }
      }

      if (isValid) {
        if (resultIndex >= this._config.offset && items.length < this._config.limit) {
          if (!denormalizedData) {
            denormalizedData = await this.denormalizer.apply<Result>(type, item, this._config.depth);
          }

          items.push(denormalizedData);
        }

        resultIndex++;
      }

      keyIndex++;
    }

    return this.listResponse(items, items.length);
  }

  private async findByKey(type = this._config.type, key = this._config.singleItem): Promise<Result> {
    if (!this.transaction) {
      this.transaction = await this._context.read(type);
    }

    const item = await this.transaction.objectStore(type).get(key);
    return item ? await this.denormalizer.apply<Result>(type, item, this._config.depth) : null;
  }

  /**
   * Find the given parent and use the value of the specified field as base data set for applying the query
   *
   * @returns {Promise<Result|ListResult<Result>>}
   */
  private async findInParent(): Promise<Result | ListResult<Result>> {
    const { parent, keys, singleItem: key } = this._config;
    const childConfig = this._schema.getTargetConfig(parent.type, parent.field);

    this.transaction = await this._context.read([parent.type, childConfig.type]);
    const parentObj = this.transaction.objectStore(parent.type).get(parent.key);
    if (!parentObj) {
      throw new NotFoundError(parent.type, parent.key);
    }

    if (parent.field in parentObj) {
      const fieldValue = parentObj[parent.field];
      const fieldIsArray = Array.isArray(fieldValue);

      if (isNull(key)) {
        if (keys) {
          if (fieldIsArray) {
            const filteredChildKeys = fieldValue.filter(k => keys.findIndex(filterKey => filterKey === k) >= 0);
            return await this.findAllByKeys(filteredChildKeys, childConfig.type);
          } else if (keys.findIndex(filterKey => filterKey === fieldValue) >= 0) {
            return await this.findByKey(childConfig.type, fieldValue);
          }
        } else {
          return await fieldIsArray
            ? this.findAllByKeys(fieldValue, childConfig.type)
            : this.findByKey(childConfig.type, key);
        }
      } else {
        if ((!fieldIsArray && fieldValue === key) || (fieldIsArray && fieldValue.indexOf(k => k === key) >= 0)) {
          return await this.findByKey(childConfig.type, key);
        }
      }
    }

    return null;
  }

  private start() {
    if (this.isRunning) {
      throw new InvalidQueryRunnerStatusError('Query is already running');
    }

    this.isRunning = true;
    this.denormalizer = this._context.denormalizerBuilder()
      .fetchCallback(this.fetchCallback)
      .build();
  }

  private stop() {
    this.isRunning = false;
    this.transaction = null;
    this.denormalizer = null;
  }

  private listResponse(items: Result[], total: number): ListResult<Result> {
    return new ListResultBuilder<Result>()
      .items(items)
      .total(total)
      .offset(this._config.offset)
      .limit(this._config.limit)
      .build();
  }

  private async fetchCallback(type: string, keys: ValidKey | ValidKey[]): Promise<any | any[]> {
    const objectStore = (await this._context.read(type)).objectStore(type);
    return await (Array.isArray(keys)
      ? Promise.all(keys.map(async key => await objectStore.get(key)))
      : objectStore.get(keys));
  }
}
