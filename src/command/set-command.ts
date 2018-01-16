import { ValidKey } from '@normalized-db/core';
import { Command } from './command';

export interface SetCommand<T extends object> extends Command<T> {

  /**
   * See `DataStore.set(…)`
   *
   * @param {ValidKey} key
   * @param {T} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  execute(key: ValidKey, data: T): Promise<boolean>;
}
