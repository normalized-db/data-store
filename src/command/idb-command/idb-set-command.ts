import { isNull, MissingKeyError, NotFoundError } from '@normalized-db/core';
import { EmptyInputError } from '../../error/empty-input-error';
import { SetCommand } from '../set-command';
import { IdbUpdateCommand } from './idb-update-command';

export class IdbSetCommand<T extends object> extends IdbUpdateCommand<T> implements SetCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async execute(data: T | T[]): Promise<boolean> {
    if (isNull(data)) {
      throw new EmptyInputError('set');
    }

    return super.executeHelper(data, true);
  }
}
