import { ValidKey } from '@normalized-db/core';
import { ObjectStore, UpgradeDB } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { BaseEvent } from '../../event/base-event';
import { OnDataChanged } from '../../event/utility/on-data-changed';
import { DataStoreTypes } from '../../model/data-store-types';
import { Logger } from '../logger';
import { LogEntry } from '../model/log-entry';
import { LogQueryConfig } from '../query/log-query-config';
import { LogQueryRunner } from '../query/log-query-runner';
import { IdbLogQueryRunner } from './idb-log-query-runner';

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

  public onUpgradeNeeded(upgradeDb: UpgradeDB): void {
    const logStore = upgradeDb.createObjectStore(IdbLogger.OBJECT_STORE, { keyPath: 'id', autoIncrement: true });
    logStore.createIndex(IdbLogger.IDX_TIME, 'time');
    logStore.createIndex(IdbLogger.IDX_ACTION, 'action');
    logStore.createIndex(IdbLogger.IDX_TYPE, 'type');
    logStore.createIndex(IdbLogger.IDX_KEY, 'key');
  }

  public queryRunner(config: LogQueryConfig): LogQueryRunner<Types> {
    return new IdbLogQueryRunner<Types>(this._context, config);
  }

  // TODO auto-close context
  public async ndbOnDataChanged(event: BaseEvent<Types, any>): Promise<void> {
    await (await this.getWritableObjectStore()).put(new LogEntry<Types>(event));
  }

  public async clear(autoCloseContext = true): Promise<boolean> {
    let success = true;
    try {
      await (await this.getWritableObjectStore()).clear();
    } catch (e) {
      console.error('message' in e ? e.message : e);
      success = false;
    }

    this.autoCloseContext(autoCloseContext);
    return success;
  }

  public async clearTypes(types: Types | Types[], autoCloseContext = true): Promise<boolean> {
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

    let success = true;
    try {
      const typeIdx = (await this.getWritableObjectStore()).index(IdbLogger.IDX_TYPE);
      const requests: Promise<void>[] = [];
      let cursor = await typeIdx.openCursor(IDBKeyRange.bound(lower, upper));
      while (cursor) {
        if (cursor.value) {
          const logEntry = cursor.value as LogEntry<Types>;
          if (typeArr.indexOf(logEntry.type) >= 0) {
            requests.push(cursor.delete());
          }
        }
        cursor = await cursor.continue();
      }
      await Promise.all(requests);
    } catch (e) {
      console.error('message' in e ? e.message : e);
      success = false;
    }

    this.autoCloseContext(autoCloseContext);
    return success;
  }

  public async clearItem(type: Types, key: ValidKey, autoCloseContext = true): Promise<boolean> {
    let success = true;
    try {
      const keyIdx = (await this.getWritableObjectStore()).index(IdbLogger.IDX_KEY);
      const requests: Promise<void>[] = [];
      let cursor = await keyIdx.openCursor(key);
      while (cursor) {
        if (cursor.value) {
          const logEntry = cursor.value as LogEntry<Types>;
          if (logEntry.type === type) {
            requests.push(cursor.delete());
          }
        }
        cursor = await cursor.continue();
      }
      await Promise.all(requests);
    } catch (e) {
      console.error('message' in e ? e.message : e);
      success = false;
    }

    this.autoCloseContext(autoCloseContext);
    return success;
  }

  private async getWritableObjectStore(): Promise<ObjectStore> {
    return (await this._context.write(IdbLogger.OBJECT_STORE)).objectStore(IdbLogger.OBJECT_STORE);
  }

  private async autoCloseContext(autoCloseContext: boolean): Promise<void> {
    if (autoCloseContext) {
      await this._context.close();
    }
  }
}
