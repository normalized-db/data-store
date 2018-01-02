import { Command } from './command';

export interface SetCommand<T extends object> extends Command<T | T[]> {

  /**
   * See `DataStore.set(…)`
   *
   * @param {T|T[]} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  execute(data: T | T[]): Promise<boolean>;
}
