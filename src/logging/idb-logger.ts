import { ValidKey } from '@normalized-db/core';
import { ObjectStore, UpgradeDB } from 'idb';
import { IdbContext } from '../context/idb-context/idb-context';
import { BaseEvent } from '../event/base-event';
import { OnDataChanged } from '../event/utility/on-data-changed';
import { DataStoreTypes } from '../model/data-store-types';
import { Logger } from './logger';
import { LogEntry } from './model/log-entry';
import { LogQueryConfig } from './query/log-query-config';
import { IdbLogQueryRunner } from './query/runner/idb-log-query-runner';
import { LogQueryRunner } from './query/runner/log-query-runner';

export class IdbLogger<Types extends DataStoreTypes> extends Logger<Types, IdbContext<Types>> implements OnDataChanged {

  public static readonly OBJECT_STORE = '_logs';

  // region index names

  public static readonly IDX_TIME = 'idx_time';
  public static readonly IDX_ACTION = 'idx_action';
  public static readonly IDX_TYPE = 'idx_type';
  public static readonly IDX_KEY = 'idx_key';

  // endregion

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

  public queryRunner(config: LogQueryConfig): LogQueryRunner<Types> {
    return new IdbLogQueryRunner<Types>(this._context, config);
  }

  public async ndbOnDataChanged(event: BaseEvent<Types, any>): Promise<void> {
    await this.writableObjectStore.put(new LogEntry<Types>(event));
  }

  public async clear(types?: Types | Types[]): Promise<boolean> {
    try {
      await this.writableObjectStore.clear();
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }

  public async clearTypes(types: Types | Types[]): Promise<boolean> {
    let lower: Types, upper: Types, typeArr: Types[];
    if (Array.isArray(types)) {
      types = types.sort();
      lower = types[0];
      upper = types[types.length - 1];
      typeArr = types;
    } else {
      lower = upper = types;
      typeArr = [types];
    }

    try {
      const typeIdx = this.writableObjectStore.index(IdbLogger.IDX_TYPE);
      typeIdx.iterateCursor(IDBKeyRange.bound(lower, upper), async cursor => {
        if (!cursor) {
          return;
        }

        const logEntry = cursor.value as LogEntry<Types>;
        if (typeArr.indexOf(logEntry.type) >= 0) {
          await cursor.delete();
        }

        await cursor.continue();
      });

    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }

  public async clearItem(type: Types, key: ValidKey): Promise<boolean> {
    try {
      const keyIdx = this.writableObjectStore.index(IdbLogger.IDX_KEY);
      keyIdx.iterateCursor(key, async cursor => {
        if (!cursor || !cursor.value) {
          return;
        }

        const logEntry = cursor.value as LogEntry<Types>;
        if (logEntry.type === type) {
          await cursor.delete();
        }

        await cursor.continue();
      });
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }

  private get writableObjectStore(): ObjectStore {
    return this._context.write(IdbLogger.OBJECT_STORE).objectStore(IdbLogger.OBJECT_STORE);
  }
}
