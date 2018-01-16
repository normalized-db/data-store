import { NdbDocument } from '@normalized-db/core';
import { Parent } from '../model/parent';
import { Command } from './command';

export interface CreateCommand<T extends NdbDocument> extends Command<T | T[]> {

  /**
   * See `DataStore.create(…)`
   *
   * @param {T|T[]} data
   * @param {Parent|Parent[]} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  execute(data: T | T[], parent?: Parent | Parent[]): Promise<boolean>;
}
