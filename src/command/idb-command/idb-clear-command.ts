import { NotFoundError } from '@normalized-db/core';
import { Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { ClearedEvent } from '../../event/cleared-event';
import { IdbLogger } from '../../logging/idb-logging/idb-logger';
import { ClearCommand } from '../clear-command';
import { IdbBaseCommand } from './idb-base-command';

export class IdbClearCommand extends IdbBaseCommand<IdbContext<any>> implements ClearCommand {

  constructor(context: IdbContext<any>, private readonly _includeLogs = false) {
    super(context, null, true);
  }

  /**
   * @inheritDoc
   *
   * @param {string | string[]} type
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  public async execute(type?: string | string[]): Promise<boolean> {
    let involvedTypes: string[];
    if (type) {
      involvedTypes = Array.isArray(type) ? type : [type];
    } else {
      involvedTypes = await this._context.objectStoreNames(false);
    }

    if (!this._includeLogs) {
      const logStoreIndex = involvedTypes.indexOf(IdbLogger.OBJECT_STORE);
      if (logStoreIndex >= 0) {
        involvedTypes.splice(logStoreIndex, 1);
      }
    }

    let transaction: Transaction;
    try {
      transaction = await this._context.write(involvedTypes);
    } catch (e) {
      console.error(e);
      return false;
    }

    try {
      involvedTypes.forEach(osn => transaction.objectStore(osn).clear());
      await transaction.complete;
    } catch (e) {
      try {
        transaction.abort();
      } catch (e2) {
        e = e2;
      }
      console.error(e);
      return false;
    }

    involvedTypes.forEach(involvedType =>
        this._eventQueue.enqueue(new ClearedEvent(involvedType)));

    this.onSuccess();
    return true;
  }
}
