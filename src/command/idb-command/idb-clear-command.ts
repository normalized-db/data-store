import { Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { NotFoundError } from '../../error/not-found-error';
import { ClearCommand } from '../clear-command';

export class IdbClearCommand implements ClearCommand {

  constructor(protected readonly _context: IdbContext) {
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
      involvedTypes = this._context.objectStoreNames();
    }

    let transaction: Transaction;
    try {
      transaction = this._context.write(involvedTypes);
    } catch (e) {
      console.error(e);
      return false;
    }

    try {
      involvedTypes.forEach(osn => transaction.objectStore(osn).clear());
    } catch (e) {
      console.error(e);
      transaction.abort();
      return false;
    }

    return true;
  }
}
