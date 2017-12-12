import { Parent } from '../model/parent';
import { Command } from './command';

export interface PutCommand<T> extends Command<T | T[]> {

  /**
   * See `DataStore.put(…)`
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  execute(data: T | T[], parent?: Parent): Promise<boolean>;
}
