import { ValidKey } from '@normalized-db/core';
import { Context } from './context/context';
import { DataStoreTypes } from './model/data-store-types';
import { Parent } from './model/parent';
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

  /**
   * Adds new items. If any item's primary key is set it still will be reassigned a new one if `autoKey` is `false`
   * for the related data-store-configuration. Non-auto-key data-stores will throw a `MissingKeyError` if no
   * manual key is provided.
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
   * Update the items. If any of the items does not exist a `NotFoundError` will be thrown.
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
   * The item will be either created or updated. For details see `.create(…)` and `.update(…)` respectively.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @returns {Promise<boolean>}
   */
  public put<Item>(type: Types, item: Item | Item[]): Promise<boolean> {
    const cmd = this._context.commandFactory().putCommand<Item>(type);
    return cmd.execute(item);
  }

  /**
   * Remove the item from its data-store and remove references to this item.
   * If any `cascadeRemoval`-children are configured for this item, these will be removed as well.
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
