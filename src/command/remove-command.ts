import { ValidKey } from '@normalized-db/core';
import { Command } from './command';

export interface RemoveCommand<T> extends Command<T | ValidKey> {

  /**
   * See `DataStore.remove(…)`
   *
   * @param {T|ValidKey} data
   * @returns {Promise<boolean>}
   */
  execute(data: T | ValidKey): Promise<boolean>;
}
