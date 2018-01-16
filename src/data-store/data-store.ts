import { NdbDocument, ValidKey } from '@normalized-db/core';
import { Context } from '../context/context';
import { EventPipe } from '../event/utility/event-pipe';
import { DataStoreTypes } from '../model/data-store-types';
import { CountQuery } from '../query/count-query';
import { Query } from '../query/query';
import { SingleItemQuery } from '../query/single-item-query';
import { IDataStore } from './data-store-interface';
import { BaseOptions } from './options/base-options';
import { ClearOptions } from './options/clear-options';
import { CountOptions } from './options/count-options';
import { CreateOptions } from './options/create-options';
import { FindByKeyOptions } from './options/find-by-key-options';
import { FindOptions } from './options/find-options';
import { PutOptions } from './options/put-options';
import { RemoveOptions } from './options/remove-options';
import { SetOptions } from './options/set-options';
import { UpdateOptions } from './options/update-options';

export class DataStore<Types extends DataStoreTypes> implements IDataStore<Types> {

  public readonly eventPipe: EventPipe<Types>;

  constructor(private readonly _context: Context<Types>, private readonly _autoCloseContext = true) {
    this.eventPipe = this._context.eventPipe;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {CountOptions} options
   * @returns {CountQuery<Item>}
   */
  public count<Item extends NdbDocument>(type: Types, options?: CountOptions): CountQuery<Item> {
    return new CountQuery<Item>(this._context, this.isAutoClose(options), type);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {FindOptions} options
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  public find<Result extends NdbDocument>(type: Types, options?: FindOptions): Query<Result> {
    return new Query<Result>(this._context, this.isAutoClose(options), type);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @param {FindByKeyOptions} options
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  public findByKey<Result extends NdbDocument>(type: Types,
                                               key: ValidKey,
                                               options?: FindByKeyOptions): SingleItemQuery<Result> {
    return new SingleItemQuery<Result>(this._context, this.isAutoClose(options), type, key);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {CreateOptions} options
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public async create<Item extends NdbDocument>(type: Types,
                                                item: Item | Item[],
                                                options?: CreateOptions): Promise<boolean> {
    const cmd = this._context.commandFactory().createCommand<Item>(type);
    const success = await cmd.execute(item, options ? options.parent : null);
    this.autoClose(options);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {UpdateOptions} options
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async update<Item extends NdbDocument>(type: Types,
                                                item: Item | Item[],
                                                options?: UpdateOptions): Promise<boolean> {
    const cmd = this._context.commandFactory().updateCommand<Item>(type);
    const success = await cmd.execute(item, options && options.isPartialUpdate);
    this.autoClose(options);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @param {Data} data
   * @param {SetOptions} options
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async set<Data extends object>(type: Types, key: ValidKey, data: Data, options?: SetOptions): Promise<boolean> {
    const cmd = this._context.commandFactory().setCommand<Data>(type);
    const success = await cmd.execute(key, data);
    this.autoClose(options);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {PutOptions} options
   * @returns {Promise<boolean>}
   */
  public async put<Item extends NdbDocument>(type: Types, item: Item | Item[], options?: PutOptions): Promise<boolean> {
    const cmd = this._context.commandFactory().putCommand<Item>(type);
    const success = await (options
        ? cmd.execute(item, options.parent, options.isPartialUpdate)
        : cmd.execute(item));
    this.autoClose(options);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @param {RemoveOptions} options
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  public async remove<Item extends NdbDocument>(type: Types,
                                                item: Item | ValidKey,
                                                options?: RemoveOptions): Promise<boolean> {
    const cmd = this._context.commandFactory().removeCommand<Item>(type);
    const success = await cmd.execute(item);
    this.autoClose(options);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {string|string[]} type
   * @param {ClearOptions} options
   * @returns {Promise<boolean>}
   */
  public async clear(type?: string | string[], options?: ClearOptions): Promise<boolean> {
    const success = await this._context.commandFactory().clearCommand(options && options.includeLogs).execute(type);
    this.autoClose(options);
    return success;
  }

  private isAutoClose(options: BaseOptions): boolean {
    return (options && options.autoCloseContext) || this._autoCloseContext;
  }

  private async autoClose(options: BaseOptions): Promise<void> {
    if (this.isAutoClose(options)) {
      await this._context.close();
    }
  }
}
