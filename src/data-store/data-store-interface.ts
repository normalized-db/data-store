import { NdbDocument, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../model/data-store-types';
import { CountQuery } from '../query/count-query';
import { Query } from '../query/query';
import { SingleItemQuery } from '../query/single-item-query';
import { ClearOptions } from './options/clear-options';
import { CountOptions } from './options/count-options';
import { CreateOptions } from './options/create-options';
import { FindByKeyOptions } from './options/find-by-key-options';
import { FindOptions } from './options/find-options';
import { PutOptions } from './options/put-options';
import { RemoveOptions } from './options/remove-options';
import { SetOptions } from './options/set-options';
import { UpdateOptions } from './options/update-options';

export interface IDataStore<Types extends DataStoreTypes> {

  /**
   * Returns the total number of items of a given type.
   *
   * @param {Types} type
   * @param {CountOptions} options
   * @returns {CountQuery<Item>}
   */
  count<Item extends NdbDocument>(type: Types, options?: CountOptions): CountQuery<Item>;

  /**
   * Create a new `Query`.
   *
   * @param {Types} type
   * @param {FindOptions} options
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  find<Result extends NdbDocument>(type: Types, options?: FindOptions): Query<Result>;

  /**
   * Create a new `SingleItemQuery`.
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @param {FindByKeyOptions} options
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  findByKey<Result extends NdbDocument>(type: Types,
                                        key: ValidKey,
                                        options?: FindByKeyOptions): SingleItemQuery<Result>;

  /**
   * Adds new items. If any item's primary key is set it still will be reassigned a new one if `autoKey` is `false`
   * for the related data-store-configuration. Non-auto-key data-stores will throw a `MissingKeyError` if no
   * manual key is provided.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {CreateOptions} options
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  create<Item extends NdbDocument>(type: Types, item: Item | Item[], options?: CreateOptions): Promise<boolean>;

  /**
   * Either fully replace existing documents by the items or partially update them by using
   * `UpdateOptions.isPartialUpdate:true`. If any of the items does not exist a `NotFoundError` will be thrown.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {UpdateOptions} options
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  update<Item extends NdbDocument>(type: Types, item: Item | Item[], options?: UpdateOptions): Promise<boolean>;

  /**
   * Update the items partially. If the item does not exist a `NotFoundError` will be thrown.
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @param {Data} data
   * @param {SetOptions} options
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  set<Data extends object>(type: Types, key: ValidKey, data: Data, options?: SetOptions): Promise<boolean>;

  /**
   * The item will be either created or updated. For details see `.create(…)` and `.update(…)` respectively.
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {PutOptions} options
   * @returns {Promise<boolean>}
   */
  put<Item extends NdbDocument>(type: Types, item: Item | Item[], options?: PutOptions): Promise<boolean>;

  /**
   * Remove the item from its data-store and remove references to this item.
   * If any `cascadeRemoval`-children are configured for this item, these will be removed as well.
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @param {RemoveOptions} options
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  remove<Item extends NdbDocument>(type: Types, item: Item | ValidKey, options?: RemoveOptions): Promise<boolean>;

  /**
   * Clear all items, optionally only these from a given type / some types. Note that references will not be updated
   * and hence could get into an invalid state!
   *
   * @param {string|string[]} type
   * @param {ClearOptions} options
   * @returns {Promise<boolean>}
   */
  clear(type: string | string[], options?: ClearOptions): Promise<boolean>;
}
