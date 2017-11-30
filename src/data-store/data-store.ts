import { ValidKey } from '@normalized-db/core';
import { Context } from '../context/context';
import { DataStoreTypes } from '../model/data-store-types';
import { Parent } from '../model/parent';
import { CountQuery } from '../query/count-query';
import { Query } from '../query/query';
import { SingleItemQuery } from '../query/single-item-query';
import { IDataStore } from './data-store-interface';

export class DataStore<Types extends DataStoreTypes> implements IDataStore<Types> {

  constructor(private readonly _context: Context, private readonly _autoCloseContext = true) {
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @returns {CountQuery}
   */
  public count(type: Types): CountQuery {
    return new CountQuery(this._context, this._autoCloseContext, type);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @returns {Query<Result>}
   * @throws {InvalidTypeError}
   */
  public find<Result>(type: Types): Query<Result> {
    return new Query<Result>(this._context, this._autoCloseContext, type);
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
    return new SingleItemQuery<Result>(this._context, this._autoCloseContext, type, key);
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public async create<Item>(type: Types, item: Item | Item[], parent?: Parent): Promise<boolean> {
    await this._context.open();
    const cmd = this._context.commandFactory().createCommand<Item>(type);
    const success = cmd.execute(item, parent);
    this.autoClose();
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|Item[]} item
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async update<Item>(type: Types, item: Item | Item[]): Promise<boolean> {
    await this._context.open();
    const cmd = this._context.commandFactory().updateCommand<Item>(type);
    const success = cmd.execute(item);
    this.autoClose();
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Parent} parent
   * @param {Item|Item[]} item
   * @returns {Promise<boolean>}
   */
  public async put<Item>(type: Types, item: Item | Item[], parent?: Parent): Promise<boolean> {
    await this._context.open();
    const cmd = this._context.commandFactory().putCommand<Item>(type);
    const success = cmd.execute(item, parent);
    this.autoClose();
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {Types} type
   * @param {Item|ValidKey} item
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  public async remove<Item>(type: Types, item: Item | ValidKey): Promise<boolean> {
    await this._context.open();
    const cmd = this._context.commandFactory().removeCommand<Item>(type);
    const success = cmd.execute(item);
    this.autoClose();
    return success;
  }

  /**
   * @inheritDoc
   *
   * @param {string|string[]} type
   * @returns {Promise<boolean>}
   */
  public async clear(type?: string | string[]): Promise<boolean> {
    await this._context.open();
    const success = await this._context.commandFactory().clearCommand().execute(type);
    this.autoClose();
    return success;
  }

  private async autoClose(): Promise<void> {
    if (this._autoCloseContext) {
      await this._context.close();
    }
  }
}
