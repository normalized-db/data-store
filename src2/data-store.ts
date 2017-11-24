import { ValidKey } from '@normalized-db/core';
import { Context } from './context/context';
import { DataStoreTypes } from './model/data-store-types';
import { Query } from './query/query';
import { SingleItemQuery } from './query/single-item-query';

export class DataStore<Types extends DataStoreTypes> {

  constructor(private readonly _context: Context) {
  }

  /**
   * Create a new `Query`.
   *
   * @param {Types} type
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  public find<Result>(type: Types): Query<Result> {
    return new Query<Result>(this._context, type);
  }

  /**
   * Create a new `SingleItemQuery`.
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  public findByKey<Result>(type: Types, key: ValidKey): SingleItemQuery<Result> {
    return new SingleItemQuery<Result>(this._context, type, key);
  }
}
