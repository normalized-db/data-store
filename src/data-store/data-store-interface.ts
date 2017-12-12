import { ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../model/data-store-types';
import { Parent } from '../model/parent';
import { CountQuery } from '../query/count-query';
import { Query } from '../query/query';
import { SingleItemQuery } from '../query/single-item-query';

export interface IDataStore<Types extends DataStoreTypes> {

  /**
   * Returns the total number of items of a given type.
   *
   * @param {Types} type
   * @returns {CountQuery}
   */
  count(type: Types): CountQuery;

  /**
   * Create a new `Query`.
   *
   * @param {Types} type
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  find<Result>(type: Types): Query<Result>;

  /**
   * Create a new `SingleItemQuery`.
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  findByKey<Result>(type: Types, key: ValidKey): SingleItemQuery<Result>;

  /**
   * Adds new items. If any item's primary key is set it still will be reassigned a new one if `autoKey` is `false`
   * for the related data-store-configuration. Non-auto-key data-stores will throw a `MissingKeyError` if no
   * manual key is provided.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  create<Item>(type: Types, item: Item | Item[], parent?: Parent): Promise<boolean>;

  /**
   * Update the items. If any of the items does not exist a `NotFoundError` will be thrown.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  update<Item>(type: Types, item: Item | Item[]): Promise<boolean>;

  /**
   * The item will be either created or updated. For details see `.create(…)` and `.update(…)` respectively.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  put<Item>(type: Types, item: Item | Item[], parent?: Parent): Promise<boolean>;

  /**
   * Remove the item from its data-store and remove references to this item.
   * If any `cascadeRemoval`-children are configured for this item, these will be removed as well.
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  remove<Item>(type: Types, item: Item | ValidKey): Promise<boolean>;

  /**
   * Clear all items, optionally only these from a given type / some types. Note that references will not be updated
   * and hence could get into an invalid state!
   *
   * @param {string|string[]} type
   * @returns {Promise<boolean>}
   */
  clear(type: string | string[]): Promise<boolean>;
}
