import { isNull, NdbDocument, NotFoundError, ValidKey } from '@normalized-db/core';
import { Transaction } from 'idb';
import { ListResult, ListResultBuilder } from '../../list-result/index';
import { IdbBaseQueryRunner } from './idb-base-query-runner';

export abstract class IdbBaseDocumentQueryRunner<Result extends NdbDocument> extends IdbBaseQueryRunner {

  protected _transaction: Transaction;

  /**
   * Find all items pre-filtered by their primary key. Paging and further filtering will be applied as defined
   * in the query-config.
   *
   * @param {ValidKey[]} keys
   * @param {string} type
   * @returns {Promise<ListResult<Result>>}
   */
  protected async findAllByKeys(keys: ValidKey[], type = this._config.type): Promise<ListResult<Result>> {
    if (!this._transaction) {
      this._transaction = await this._context.read(type);
    }

    const objectStore = this._transaction.objectStore(type);
    const items = [];
    let keyIndex = 0, resultIndex = 0;
    while (keyIndex < keys.length) {
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
        if (this._config.filter.requiresDenormalization) {
          denormalizedData = await this._denormalizer.apply<Result>(type, item, this._config.depth);
          isValid = await this._config.filter.test(denormalizedData);
        } else {
          isValid = await this._config.filter.test(item);
        }
      }

      if (isValid) {
        if (resultIndex >= this._config.offset && items.length < this._config.limit) {
          if (!denormalizedData) {
            denormalizedData = await this._denormalizer.apply<Result>(type, item, this._config.depth);
          }

          items.push(denormalizedData);
        }

        resultIndex++;
      }

      keyIndex++;
    }

    return this.createListResult(items, resultIndex);
  }

  protected async findByKey(type = this._config.type, key = this._config.singleItem): Promise<Result> {
    if (!this._transaction) {
      this._transaction = await this._context.read(type);
    }

    const item = await this._transaction.objectStore(type).get(key);
    return item ? await this._denormalizer.apply<Result>(type, item, this._config.depth) : null;
  }

  /**
   * Find the given parent and use the value of the specified field as base data set for applying the query
   *
   * @returns {Promise<Result|ListResult<Result>>}
   */
  protected async findInParent(): Promise<Result | ListResult<Result>> {
    const { parent, keys, singleItem: key } = this._config;
    const childConfig = this._schema.getTargetConfig(parent.type, parent.field);

    this._transaction = await this._context.read([parent.type, childConfig.type]);
    const parentObj = await this._transaction.objectStore(parent.type).get(parent.key);
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

  protected createListResult(items: Result[], total: number): ListResult<Result> {
    return new ListResultBuilder<Result>()
        .items(items)
        .total(total)
        .offset(this._config.offset)
        .limit(this._config.limit)
        .build();
  }
}
