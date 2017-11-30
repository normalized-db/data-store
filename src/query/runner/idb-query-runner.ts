import { ISchema, isNull, ValidKey } from '@normalized-db/core';
import { Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { InvalidQueryConfigError } from '../../error/invalid-query-config-error';
import { NotFoundError } from '../../error/not-found-error';
import { ListResult } from '../list-result/list-result';
import { ListResultBuilder } from '../list-result/list-result.builder';
import { QueryConfig } from '../query-config';
import { QueryRunner } from './query-runner';

export class IdbQueryRunner<Result> implements QueryRunner<Result> {

  private readonly _schema: ISchema;

  constructor(private readonly _context: IdbContext,
              private readonly _config: QueryConfig) {
    this._schema = this._context.schema();
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<number>}
   */
  public count(): Promise<number> {
    return this._context.read(this._config.type).objectStore(this._config.type).count();
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<ListResult<Result>>}
   */
  public async execute(): Promise<ListResult<Result>> {
    if (this._config.parent) {
      return (await this.findInParent()) as ListResult<Result>;
    } else {
      if (this._config.singleItem) {
        console.warn(
          'The query configuration has a key for a single-item-query but is run as list-query. The key will be ignored');
      }

      return await this.findAll();
    }
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<Result>}
   */
  public async singleExecute(): Promise<Result> {
    if (!this._config.singleItem) {
      throw new InvalidQueryConfigError('Primary key for `singleExecute` is missing');
    }

    if (this._config.parent) {
      return (await this.findInParent()) as Result;
    } else {
      return await this.findByKey();
    }
  }

  /**
   * Find all items of a given type. Paging and filter will be applied as defined in the query-config.
   *
   * @param {string} type
   * @param {Transaction} transaction
   * @returns {Promise<ListResult<Result>>}
   */
  private async findAll(type = this._config.type, transaction?: Transaction): Promise<ListResult<Result>> {
    const objectStore = (transaction || this._context.read(type)).objectStore(type);
    const hasRange = this._config.offset > 0 || this._config.limit < Infinity;
    const hasFilter = !!this._config.filter;

    if (!hasRange && !hasFilter) {
      const data = await objectStore.getAll();
      const denormalizedData = await this._context.denormalizer().applyAll<Result>(data, type, this._config.depth);
      return this.listResponse(denormalizedData, data.length);
    } else {
      const items = [];
      let index = 0;
      objectStore.iterateCursor(async cursor => {
        if (!cursor) {
          return;
        }

        if (items.length >= this._config.limit) {
          cursor.advance(1000);
          return;
        }

        let denormalizedData, isValid = true;
        if (hasFilter) {
          if (this._config.filter.requiresNormalization) {
            denormalizedData = await this._context.denormalizer().apply<Result>(cursor.value, type, this._config.depth);
            isValid = this._config.filter.test(denormalizedData);
          } else {
            isValid = this._config.filter.test(cursor.value);
          }
        }

        if (isValid) {
          if (index >= this._config.offset && items.length < this._config.limit) {
            if (!denormalizedData) {
              denormalizedData = await this._context.denormalizer()
                .apply<Result>(cursor.value, type, this._config.depth);
            }

            items.push(denormalizedData);
          }

          index++;
        }

        cursor.continue();
      });

      return this.listResponse(items, items.length);
    }
  }

  /**
   * Find all items pre-filtered by their primary key. Paging and further filtering will be applied as defined
   * in the query-config.
   *
   * @param {ValidKey[]} keys
   * @param {string} type
   * @param {Transaction} transaction
   * @returns {Promise<ListResult<Result>>}
   */
  private async findAllByKeys(keys: ValidKey[],
                              type = this._config.type,
                              transaction?: Transaction): Promise<ListResult<Result>> {
    const objectStore = (transaction || this._context.read(type)).objectStore(type);

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
          denormalizedData = await this._context.denormalizer().apply<Result>(item, type, this._config.depth);
          isValid = this._config.filter.test(denormalizedData);
        } else {
          isValid = this._config.filter.test(item);
        }
      }

      if (isValid) {
        if (resultIndex >= this._config.offset && items.length < this._config.limit) {
          if (!denormalizedData) {
            denormalizedData = await this._context.denormalizer().apply<Result>(item, type, this._config.depth);
          }

          items.push(denormalizedData);
        }

        resultIndex++;
      }

      keyIndex++;
    }

    return this.listResponse(items, items.length);
  }

  private async findByKey(type = this._config.type,
                          key = this._config.singleItem,
                          transaction?: Transaction): Promise<Result> {
    if (!transaction) {
      transaction = this._context.read(type);
    }

    const item = await transaction.objectStore(type).get(key);
    return item ? await this._context.denormalizer().apply<Result>(item, type, this._config.depth) : null;
  }

  /**
   * Find the given parent and use the value of the specified field as base data set for applying the query
   *
   * @returns {Promise<Result|ListResult<Result>>}
   */
  private async findInParent(): Promise<Result | ListResult<Result>> {
    const { parent, singleItem: key } = this._config;
    const childConfig = this._schema.getTargetConfig(parent.type, parent.field);

    const transaction = this._context.read([parent.type, childConfig.type]);
    const parentObj = transaction.objectStore(parent.type).get(parent.key);
    if (!parentObj) {
      throw new NotFoundError(parent.type, parent.key);
    }

    if (parent.field in parentObj) {
      const fieldValue = parentObj[parent.field];
      const isArray = Array.isArray(fieldValue);

      if (isNull(key)) {
        return await isArray
          ? this.findAllByKeys(fieldValue, childConfig.type, transaction)
          : this.findByKey(childConfig.type, key);
      } else {
        if ((!isArray && fieldValue === key) || (isArray && fieldValue.indexOf(k => k === key) >= 0)) {
          return await this.findByKey(childConfig.type, key, transaction);
        }
      }
    }

    return null;
  }

  private listResponse(items: Result[], total: number): ListResult<Result> {
    return new ListResultBuilder<Result>()
      .items(items)
      .total(total)
      .offset(this._config.offset)
      .limit(this._config.limit)
      .build();
  }
}
