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
   * @param {boolean} autoCloseContext
   * @returns {CountQuery}
   */
  count(type: Types, autoCloseContext?: boolean): CountQuery;

  /**
   * Create a new `Query`.
   *
   * @param {Types} type
   * @param {boolean} autoCloseContext
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  find<Result>(type: Types, autoCloseContext?: boolean): Query<Result>;

  /**
   * Create a new `SingleItemQuery`.
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @param {boolean} autoCloseContext
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  findByKey<Result>(type: Types, key: ValidKey, autoCloseContext?: boolean): SingleItemQuery<Result>;

  /**
   * Adds new items. If any item's primary key is set it still will be reassigned a new one if `autoKey` is `false`
   * for the related data-store-configuration. Non-auto-key data-stores will throw a `MissingKeyError` if no
   * manual key is provided.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {Parent} parent
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  create<Item>(type: Types, item: Item | Item[], parent?: Parent, autoCloseContext?: boolean): Promise<boolean>;

  /**
   * Update the items. If any of the items does not exist a `NotFoundError` will be thrown.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  update<Item>(type: Types, item: Item | Item[], autoCloseContext?: boolean): Promise<boolean>;

  /**
   * The item will be either created or updated. For details see `.create(…)` and `.update(…)` respectively.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {Parent} parent
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   */
  put<Item>(type: Types, item: Item | Item[], parent?: Parent, autoCloseContext?: boolean): Promise<boolean>;

  /**
   * Remove the item from its data-store and remove references to this item.
   * If any `cascadeRemoval`-children are configured for this item, these will be removed as well.
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  remove<Item>(type: Types, item: Item | ValidKey, autoCloseContext?: boolean): Promise<boolean>;

  /**
   * Clear all items, optionally only these from a given type / some types. Note that references will not be updated
   * and hence could get into an invalid state!
   *
   * @param {string|string[]} type
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   */
  clear(type: string | string[], autoCloseContext?: boolean): Promise<boolean>;
}
