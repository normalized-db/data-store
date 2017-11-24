import { ISchema, isNull, ValidKey } from '@normalized-db/core';
import { Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context';
import { NotFoundError } from '../../error/not-found-error';
import { QueryConfig } from '../query-config';
import { QueryRunner } from './query-runner';

export class IdbQueryRunner<Result> implements QueryRunner<Result> {

  private readonly _schema: ISchema;

  constructor(private readonly _context: IdbContext,
              private readonly _config: QueryConfig) {
    this._schema = this._context.schema();
  }

  public execute(): Promise<Result[]> {
    if (this._config.parent) {
      return this.findInParent();
    } else if (this._config.singleItem) {
      return this.findByKey();
    } else if (this._config.filter) {
      return this.findAll();
    }
  }

  // TODO for list-find -> add `total` to result (how many items matched the filter).
  //      User-specified `ListResponseFactory` with offset, limit, total and items as args

  private async findAll(type = this._config.type,
                        transaction?: Transaction): Promise<Result[]> {
    const objectStore = (transaction || this._context.read(type)).objectStore(type);

    const hasRange = this._config.offset > 0 || this._config.limit < Infinity;
    const hasFilter = !!this._config.filter;

    if (!hasRange && !hasFilter) {
      const data = await objectStore.getAll();
      return await this._context.denormalizer().applyAll<Result>(data, type, this._config.depth);
    } else {
      const result = [];
      let index = 0;
      objectStore.iterateCursor(async cursor => {
        if (!cursor || result.length >= this._config.limit) {
          return;
        }

        if (index < this._config.offset) {
          cursor.advance(this._config.offset - index);
          return;
        }

        const data = await this._context.denormalizer().apply<Result>(cursor.value, type, this._config.depth);
        if (!hasFilter || this._config.filter(data)) {
          result.push(data);
        }

        index++;
        cursor.continue();
      });
    }
  }

  private async findAllByKeys(keys: ValidKey[],
                              type = this._config.type,
                              transaction?: Transaction): Promise<Result[]> {
    const objectStore = (transaction || this._context.read(type)).objectStore(type);

    const result = [];
    let index = 0;
    await Promise.all(keys.map(async key => {
      const cursor = await objectStore.openCursor(key);
      if (!cursor || result.length >= this._config.limit) {
        return;
      }

      if (index >= this._config.offset) {
        const item = await this._context.denormalizer().apply<Result>(cursor.value, type, this._config.depth);
        if (!this._config.filter || this._config.filter(item)) {
          result.push(item);
        }
      }

      index++;
    }));

    return result;
  }

  private async findByKey(type = this._config.type,
                          key = this._config.singleItem,
                          transaction?: Transaction): Promise<Result[]> {
    if (!transaction) {
      transaction = this._context.read(type);
    }

    const item = await transaction.objectStore(type).get(key);

    return item ? [await this._context.denormalizer().apply<Result>(item, type, this._config.depth)] : null;
  }

  /**
   * Find the given parent and use the value of the specified field as base data set for applying the query
   *
   * @returns {Promise<Result[]>}
   */
  private async findInParent(): Promise<Result[]> {
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
}
