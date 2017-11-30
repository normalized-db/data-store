import { isNull } from '@normalized-db/core';
import { ObjectStore } from 'idb';
import { MissingKeyError } from '../../error/missing-key-error';
import { NotFoundError } from '../../error/not-found-error';
import { UpdateCommand } from '../update-command';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export class IdbUpdateCommand<T> extends IdbBaseWriteCommand<T> implements UpdateCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   * @throws {NotFoundError}
   */
  public async execute(data: T | T[]): Promise<boolean> {
    const objectStore = this._context.read(this._type).objectStore(this._type);
    if (Array.isArray(data)) {
      await Promise.all(data.map(item => this.checkExistence(objectStore, item)));
    } else {
      await this.checkExistence(objectStore, data);
    }

    return super.execute(data);
  }

  private async checkExistence(objectStore: ObjectStore, item: T): Promise<void> {
    const key = this.getKey(item);
    const existingItem = objectStore.get(key);
    if (isNull(existingItem)) {
      throw new NotFoundError(this._type, key);
    }
  }
}
