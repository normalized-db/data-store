import { isNull, MissingKeyError, NdbDocument, NotFoundError } from '@normalized-db/core';
import { EmptyInputError } from '../../error/empty-input-error';
import { UpdateCommand } from '../update-command';
import { IdbBaseUpdateCommand } from './idb-base-update-command';

export class IdbUpdateCommand<T extends NdbDocument> extends IdbBaseUpdateCommand<T> implements UpdateCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {boolean} isPartialUpdate
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async execute(data: T | T[], isPartialUpdate = false): Promise<boolean> {
    if (isNull(data)) {
      throw new EmptyInputError('update');
    }

    return this.executeHelper(data, isPartialUpdate);
  }
}
