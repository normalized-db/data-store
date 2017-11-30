import { BaseCommand } from './base-command';

export interface UpdateCommand<T> extends BaseCommand<T | T[]> {

  /**
   * Update the items. If any of the items does not exist a `NotFoundError` will be thrown.
   *
   * @param {T|T[]} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  execute(data: T | T[]): Promise<boolean>;
}
