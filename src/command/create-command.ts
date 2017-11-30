import { Parent } from '../model/parent';
import { BaseCommand } from './base-command';

export interface CreateCommand<T> extends BaseCommand<T | T[]> {

  /**
   * See `DataStore.create(…)`
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  execute(data: T | T[], parent?: Parent): Promise<boolean>;
}
