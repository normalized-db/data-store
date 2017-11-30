import { Parent } from '../model/parent';
import { BaseCommand } from './base-command';

export interface PutCommand<T> extends BaseCommand<T | T[]> {

  /**
   * See `DataStore.put(…)`
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  execute(data: T | T[], parent?: Parent): Promise<boolean>;
}
