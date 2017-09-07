import { ValidKey } from '@normalized-db/core';
import { Subject } from 'rxjs/Subject';
import { DataStore } from './data-store';
import { ObserveResult } from './model/observe-result';

export class ObservedDataStore extends DataStore {

  public readonly onPut: Subject<ObserveResult> = new Subject<ObserveResult>();
  public readonly onRemoved: Subject<ObserveResult> = new Subject<ObserveResult>();
  public readonly onCleared: Subject<ObserveResult> = new Subject<ObserveResult>();
  public readonly onChanged: Subject<ObserveResult> = new Subject<ObserveResult>();

  public async put<T>(data: T | T[], type: string): Promise<void> {
    await super.put(data, type);

    this.notify('put', type, Array.isArray(data) ? data : [data]);
  }

  public async remove<Key extends ValidKey>(keys: Key | Key[], type: string): Promise<Key[]> {
    const removedKeys = await super.remove<Key>(keys, type);

    this.notify('removed', type, removedKeys);

    return removedKeys;
  }

  protected async clearType(type: string): Promise<void> {
    await super.clearType(type);

    this.notify('cleared', type);
  }

  private notify(action: 'put' | 'removed' | 'cleared', type: string, data?: any[]) {
    const observeResult: ObserveResult = {
      action: action,
      type: type
    };

    if (data) {
      observeResult.data = data;
    }

    this['on' + action[0].toUpperCase() + action.substr(1)].next(observeResult);
    this.onChanged.next(observeResult);
  }
}
