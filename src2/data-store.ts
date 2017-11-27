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

  // TODO add js-docs, apply normalization, save normalized items to their tables as well
  // TODO add `Parent`
  // TODO add event-based `Logger`

  public create<Item>(type: Types, item: Item): Promise<boolean> {
    const cmd = this._context.commandFactory().createCommand<Item>(type);
    return cmd.execute(item);
  }

  public update<Item>(type: Types, item: Item): Promise<boolean> {
    const cmd = this._context.commandFactory().updateCommand<Item>(type);
    return cmd.execute(item);
  }

  public remove<Item>(type: Types, item: Item): Promise<boolean> {
    const cmd = this._context.commandFactory().removeCommand<Item>(type);
    return cmd.execute(item);
  }
}
