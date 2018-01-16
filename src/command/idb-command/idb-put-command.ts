import { isNull, MissingKeyError, NdbDocument } from '@normalized-db/core';
import { IdbContext } from '../../context/idb-context/idb-context';
import { EmptyInputError } from '../../error/empty-input-error';
import { Parent } from '../../model/parent';
import { PutCommand } from '../put-command';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export class IdbPutCommand<T extends NdbDocument> extends IdbBaseWriteCommand<T> implements PutCommand<T> {

  constructor(context: IdbContext<any>, type: string) {
    super(context, type);
    this.setKey = this.setKey.bind(this);
  }

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {Parent|Parent[]} parent
   * @param {boolean} isPartialUpdate
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public async execute(data: T | T[], parent?: Parent | Parent[], isPartialUpdate = false): Promise<boolean> {
    if (isNull(data)) {
      throw new EmptyInputError('put');
    }

    if (Array.isArray(data)) {
      data.forEach(this.setKey);
    } else {
      this.setKey(data);
    }

    return await super.write(data, parent);
  }

  private setKey(item: T): void {
    if (this.hasKey(item) || this._typeConfig.autoKey) {
      return;
    }

    const newKey = this._context.newKey(this._type);
    if (isNull(newKey)) {
      throw new MissingKeyError(this._type, this._typeConfig.key);
    }

    item[this._typeConfig.key] = newKey;
  }
}
