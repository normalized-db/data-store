import { isNull, MissingKeyError, NdbDocument } from '@normalized-db/core';
import { IdbContext } from '../../context/idb-context/idb-context';
import { EmptyInputError } from '../../error/empty-input-error';
import { Parent } from '../../model/parent';
import { CreateCommand } from '../create-command';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export class IdbCreateCommand<T extends NdbDocument> extends IdbBaseWriteCommand<T> implements CreateCommand<T> {

  constructor(context: IdbContext<any>, type: string) {
    super(context, type);
    this.setKey = this.setKey.bind(this);
  }

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {Parent|Parent[]} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public async execute(data: T | T[], parent?: Parent | Parent[]): Promise<boolean> {
    if (isNull(data)) {
      throw new EmptyInputError('create');
    }

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        await this.setKey(data[i]);
      }
    } else {
      await this.setKey(data);
    }

    return super.write(data, parent);
  }

  /**
   * Set a new key. Any existing key will be overridden.
   *
   * @param {T} item
   */
  private async setKey(item: T): Promise<void> {
    if (this._typeConfig.autoKey) {
      delete item[this._typeConfig.key];
    } else {
      const newKey = await this._context.newKey(this._type);
      if (isNull(newKey)) {
        throw new MissingKeyError(this._type, this._typeConfig.key);
      }

      item[this._typeConfig.key] = newKey;
    }
  }
}
