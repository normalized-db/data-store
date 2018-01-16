import { isNull, MissingKeyError, NotFoundError, ValidKey } from '@normalized-db/core';
import { EmptyInputError } from '../../error/empty-input-error';
import { SetCommand } from '../set-command';
import { IdbBaseUpdateCommand } from './idb-base-update-command';

export class IdbSetCommand<T extends object> extends IdbBaseUpdateCommand<T> implements SetCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {ValidKey} key
   * @param {T|T[]} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async execute(key: ValidKey, data: T): Promise<boolean> {
    if (isNull(data)) {
      throw new EmptyInputError('set');
    }

    data[this._typeConfig.key] = key;

    return super.executeHelper(data, true);
  }
}
