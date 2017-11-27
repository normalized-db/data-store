import { ValidKey } from '@normalized-db/core';
import { isValidKey } from '../../utility/valid-key';
import { BaseCommand } from '../base-command';
import { RemoveCommand } from '../remove-command';

export class IdbRemoveCommand<T> extends BaseCommand<T | ValidKey> implements RemoveCommand<T | ValidKey> {

  public async execute(item: T | ValidKey): Promise<boolean> {
    const key = isValidKey(item) ? item as ValidKey : this.getKey(item);
    const objectStore = this._context.write(this._type).objectStore(this._type);
    try {
      const oldItem = await objectStore.get(key);
      await Promise.all([
        this.cascadeRemoval(oldItem),
        this.updateRefs(oldItem),
        this.updateParents(oldItem),
        objectStore.delete(key)
      ]);
    } catch (e) {
      return false;
    }

    return true;
  }

  private async cascadeRemoval(oldItem: T): Promise<void> {
    // TODO
  }

  private async updateRefs(oldItem: T): Promise<void> {
    // TODO
  }

  private async updateParents(oldItem: T): Promise<void> {
    // TODO
  }
}
