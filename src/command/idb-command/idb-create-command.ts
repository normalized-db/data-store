import { MissingKeyError } from '../../error/missing-key-error';
import { Parent } from '../../model/parent';
import { CreateCommand } from '../create-command';
import { IdbBaseWriteCommand } from './idb-base-write-command';

export class IdbCreateCommand<T> extends IdbBaseWriteCommand<T> implements CreateCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   * @throws {MissingKeyError}
   */
  public async execute(data: T | T[], parent?: Parent): Promise<boolean> {
    if (Array.isArray(data)) {
      data.forEach(item => this.setKey(item));
    } else {
      this.setKey(data);
    }

    return super.execute(data, parent);
  }

  /**
   * Set a new key. Any existing key will be overridden.
   *
   * @param {T} item
   */
  private setKey(item: T): void {
    if (this._typeConfig.autoKey) {
      delete item[this._typeConfig.key];
    } else {
      item[this._typeConfig.key] = this._context.newKey(this._type);
    }
  }
}
