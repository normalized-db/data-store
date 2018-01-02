import { NdbDocument, ValidKey } from '@normalized-db/core';
import { Context } from '../context/context';
import { EventPipe } from '../event/utility/event-pipe';
import { DataStoreTypes } from '../model/data-store-types';
import { Parent } from '../model/parent';
import { CountQuery } from '../query/count-query';
import { Query } from '../query/query';
import { SingleItemQuery } from '../query/single-item-query';
import { IDataStore } from './data-store-interface';

export class DataStore<Types extends DataStoreTypes> implements IDataStore<Types> {

  public readonly eventPipe: EventPipe<Types>;

  constructor(private readonly _context: Context<Types>, private readonly _autoCloseContext = true) {
    this.eventPipe = this._context.eventPipe;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {boolean} autoCloseContext
   * @returns {CountQuery<Item>}
   */
  public count<Item extends NdbDocument>(type: Types, autoCloseContext = false): CountQuery<Item> {
    return new CountQuery<Item>(this._context, autoCloseContext || this._autoCloseContext, type);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {boolean} autoCloseContext
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  public find<Result extends NdbDocument>(type: Types, autoCloseContext = false): Query<Result> {
    return new Query<Result>(this._context, autoCloseContext || this._autoCloseContext, type);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {ValidKey} key
   * @param {boolean} autoCloseContext
   * @returns {SingleItemQuery<Result>}
   * @throws {InvalidTypeError}
   */
  public findByKey<Result extends NdbDocument>(type: Types,
                                               key: ValidKey,
                                               autoCloseContext = false): SingleItemQuery<Result> {
    return new SingleItemQuery<Result>(this._context, autoCloseContext || this._autoCloseContext, type, key);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {Parent} parent
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public async create<Item extends NdbDocument>(type: Types,
                                                item: Item | Item[],
                                                parent?: Parent,
                                                autoCloseContext = false): Promise<boolean> {
    const cmd = this._context.commandFactory().createCommand<Item>(type);
    const success = await cmd.execute(item, parent);
    this.autoClose(autoCloseContext);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async update<Item extends NdbDocument>(type: Types,
                                                item: Item | Item[],
                                                autoCloseContext = false): Promise<boolean> {
    const cmd = this._context.commandFactory().updateCommand<Item>(type);
    const success = await cmd.execute(item);
    this.autoClose(autoCloseContext);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Parent} parent
   * @param {Item|Item[]} item
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   */
  public async put<Item extends NdbDocument>(type: Types,
                                             item: Item | Item[],
                                             parent?: Parent,
                                             autoCloseContext = false): Promise<boolean> {
    const cmd = this._context.commandFactory().putCommand<Item>(type);
    const success = await cmd.execute(item, parent);
    this.autoClose(autoCloseContext);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  public async remove<Item extends NdbDocument>(type: Types,
                                                item: Item | ValidKey,
                                                autoCloseContext = false): Promise<boolean> {
    const cmd = this._context.commandFactory().removeCommand<Item>(type);
    const success = await cmd.execute(item);
    this.autoClose(autoCloseContext);
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {string|string[]} type
   * @param {boolean} includeLogs
   * @param {boolean} autoCloseContext
   * @returns {Promise<boolean>}
   */
  public async clear(type?: string | string[], includeLogs?: boolean, autoCloseContext = false): Promise<boolean> {
    const success = await this._context.commandFactory().clearCommand(includeLogs).execute(type);
    this.autoClose(autoCloseContext);
    return success;
  }

  private async autoClose(autoCloseContext: boolean): Promise<void> {
    if (autoCloseContext || this._autoCloseContext) {
      await this._context.close();
    }
  }
}
