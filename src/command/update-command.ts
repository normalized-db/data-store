import { BaseCommand } from './base-command';

export interface UpdateCommand<T> extends BaseCommand<T | T[]> {

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
