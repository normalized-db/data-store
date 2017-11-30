import { isNull } from '@normalized-db/core';
import { MissingKeyError } from '../../error/missing-key-error';
import { Parent } from '../../query/model/parent';
import { PutCommand } from '../put-command';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export class IdbPutCommand<T> extends IdbBaseWriteCommand<T> implements PutCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  public execute(data: T|T[], parent?: Parent): Promise<boolean> {
    if (Array.isArray(data)) {
      data.forEach(item => this.setKey(item));
    } else {
      this.setKey(data);
    }

    return super.execute(data, parent);
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
