import { isNull, MissingKeyError, NdbDocument, NotFoundError } from '@normalized-db/core';
import { ObjectStore } from 'idb';
import { EmptyInputError } from '../../error/empty-input-error';
import { UpdateCommand } from '../update-command';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export class IdbUpdateCommand<T extends NdbDocument> extends IdbBaseWriteCommand<T> implements UpdateCommand<T> {

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

  protected async executeHelper(data: T | T[], isPartialUpdate = false): Promise<boolean> {
    const objectStore = (await this._context.read(this._type)).objectStore(this._type);
    if (Array.isArray(data)) {
      await Promise.all(data.map(item => this.checkExistence(objectStore, item)));
    } else {
      await this.checkExistence(objectStore, data);
    }

    return super.write(data, null, isPartialUpdate);
  }

  private async checkExistence(objectStore: ObjectStore, item: T): Promise<void> {
    const key = this.getKey(item);
    const existingItem = objectStore.get(key);
    if (isNull(existingItem)) {
      throw new NotFoundError(this._type, key);
    }
  }
}
