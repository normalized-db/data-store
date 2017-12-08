import { ObjectStore, UpgradeDB } from 'idb';
import { IdbContext } from '../context/idb-context/idb-context';
import { BaseEvent } from '../event/base-event';
import { OnDataChanged } from '../event/utility/on-data-changed';
import { DataStoreTypes } from '../model/data-store-types';
import { Logger } from './logger';
import { LogEntry } from './model/log-entry';

export class IdbLogger<Types extends DataStoreTypes> extends Logger<Types, IdbContext<Types>> implements OnDataChanged {

  public static readonly OBJECT_STORE = '_logs';

  private static readonly IDX_TIME = 'idx_time';
  private static readonly IDX_ACTION = 'idx_action';
  private static readonly IDX_TYPE = 'idx_type';
  private static readonly IDX_KEY = 'idx_key';

  constructor(idbContext: IdbContext<Types>) {
    super(idbContext);
  }

  public onUpgradeNeeded(upgradeDb: UpgradeDB) {
    const logStore = upgradeDb.createObjectStore(IdbLogger.OBJECT_STORE, { keyPath: 'id', autoIncrement: true });
    logStore.createIndex(IdbLogger.IDX_TIME, 'time');
    logStore.createIndex(IdbLogger.IDX_ACTION, 'action');
    logStore.createIndex(IdbLogger.IDX_TYPE, 'type');
    logStore.createIndex(IdbLogger.IDX_KEY, 'key');
  }

  public async ndbOnDataChanged(event: BaseEvent<Types, any>): Promise<void> {
    await this.objectStore(true).put(new LogEntry<Types>(event));
  }

  private objectStore(write = false): ObjectStore {
    const transaction = write
      ? this._context.write(IdbLogger.OBJECT_STORE)
      : this._context.read(IdbLogger.OBJECT_STORE);
    return transaction.objectStore(IdbLogger.OBJECT_STORE);
  }
}
