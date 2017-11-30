import { Parent } from '../query/model/parent';
import { BaseCommand } from './base-command';

export interface CreateCommand<T> extends BaseCommand<T | T[]> {

  /**
   * Adds new items. If any item's primary key is set it still will be reassigned a new one if `autoKey` is `false`
   * for the related data-store-configuration. Non-auto-key data-stores will throw a `MissingKeyError` if no
   * manual key is provided.
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  execute(data: T | T[], parent?: Parent): Promise<boolean>;
}
