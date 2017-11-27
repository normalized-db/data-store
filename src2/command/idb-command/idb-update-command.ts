import { BaseCommand } from '../base-command';
import { UpdateCommand } from '../update-command';

export class IdbUpdateCommand<T> extends BaseCommand<T> implements UpdateCommand<T> {

  public async execute(item: T): Promise<boolean> {
    const key = this.getKey(item);
    const objectStore = this._context.write(this._type).objectStore(this._type);
    try {
      const oldItem = await objectStore.get(key);
      await Promise.all([
        this.updateRefs(oldItem, item),
        objectStore.put(item)
      ]);
    } catch (e) {
      return false;
    }

    return true;
  }

  private async updateRefs(oldItem: T, newItem: T): Promise<void> {
    // TODO
  }
}
