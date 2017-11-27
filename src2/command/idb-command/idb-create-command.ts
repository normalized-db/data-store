import { MissingKeyError } from '../../error/missing-key-error';
import { BaseCommand } from '../base-command';
import { CreateCommand } from '../create-command';

export class IdbCreateCommand<T> extends BaseCommand<T> implements CreateCommand<T> {

  public async execute(item: T): Promise<boolean> {
    this.setKey(item);
    const objectStore = this._context.write(this._type).objectStore(this._type);
    try {
      item[this._typeConfig.key] = await objectStore.add(item);
    } catch (e) {
      return false;
    }

    return true;
  }

  private setKey(item: T): void {
    if (!this.hasKey(item)) {
      if (!this._typeConfig.autoKey) {
        throw new MissingKeyError(this._type, this._typeConfig.key);
      }

      // TODO apply new key
    }
  }
}
