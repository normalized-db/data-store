import { ValidKey } from '@normalized-db/core';
import { Context } from './context/context';
import { IDataStore } from './data-store-interface';
import { DataStoreTypes } from './model/data-store-types';
import { Parent } from './model/parent';
import { Query } from './query/query';
import { SingleItemQuery } from './query/single-item-query';

export class DataStore<Types extends DataStoreTypes> implements IDataStore<Types> {

  constructor(private readonly _context: Context) {
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  public find<Result>(type: Types): Query<Result> {
    return new Query<Result>(this._context, type);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  public findByKey<Result>(type: Types, key: ValidKey): SingleItemQuery<Result> {
    return new SingleItemQuery<Result>(this._context, type, key);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item} item
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public create<Item>(type: Types, item: Item, parent?: Parent): Promise<boolean> {
    const cmd = this._context.commandFactory().createCommand<Item>(type);
    return cmd.execute(item, parent);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @returns {Promise<boolean>}
   */
  public update<Item>(type: Types, item: Item | Item[]): Promise<boolean> {
    const cmd = this._context.commandFactory().updateCommand<Item>(type);
    return cmd.execute(item);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Parent} parent
   * @param {Item|Item[]} item
   * @returns {Promise<boolean>}
   */
  public put<Item>(type: Types, item: Item | Item[], parent?: Parent): Promise<boolean> {
    const cmd = this._context.commandFactory().putCommand<Item>(type);
    return cmd.execute(item, parent);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @returns {Promise<boolean>}
   */
  public remove<Item>(type: Types, item: Item | ValidKey): Promise<boolean> {
    const cmd = this._context.commandFactory().removeCommand<Item>(type);
    return cmd.execute(item);
  }
}
