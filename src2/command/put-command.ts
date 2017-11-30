import { Parent } from '../query/model/parent';
import { BaseCommand } from './base-command';

export interface PutCommand<T> extends BaseCommand<T | T[]> {

  /**
   * The item will be either created or updated.
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  execute(data: T | T[], parent?: Parent): Promise<boolean>;
}
