import { NdbDocument } from '@normalized-db/core';
import { Command } from './command';

export interface UpdateCommand<T extends NdbDocument> extends Command<T | T[]> {

  /**
   * See `DataStore.update(…)`
   *
   * @param {T|T[]} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  execute(data: T | T[]): Promise<boolean>;
}
