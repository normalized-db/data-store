import { isNull } from '@normalized-db/core';
import { ObjectStore } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { DataStoreTypes } from '../../model/data-store-types';
import { ClearLogsCommand } from '../clear-command/clear-logs-command';
import { ClearLogsOptions } from '../clear-command/clear-logs-options';
import { LogEntry } from '../model/log-entry';
import { IdbLogger } from './idb-logger';

export class IdbClearLogsCommand<Types extends DataStoreTypes> implements ClearLogsCommand<Types> {

  constructor(private readonly _context: IdbContext<Types>) {
  }

  public async execute(options?: ClearLogsOptions<Types>): Promise<boolean> {
    try {
      if (options && !isNull(options.key)) {
        await this.clearItem(options);
      } else if (options && options.types && options.types.length > 0) {
        await this.clearTypes(options);
      } else {
        await (await this.getWritableObjectStore()).clear();
      }
    } catch (e) {
      console.error('message' in e ? e.message : e);
      return false;
    }

    return true;
  }

  private async clearTypes(options?: ClearLogsOptions<Types>): Promise<void> {
    let lower: Types, upper: Types, typeArr: Types[];
    if (Array.isArray(options.types)) {
      typeArr = options.types.sort();
      lower = typeArr[0];
      upper = typeArr[options.types.length - 1];
    } else {
      typeArr = [options.types];
      lower = upper = options.types;
    }

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
  }

  private async clearItem(options?: ClearLogsOptions<Types>): Promise<void> {
    const keyIdx = (await this.getWritableObjectStore()).index(IdbLogger.IDX_KEY);
    const requests: Promise<void>[] = [];
    const isTypesArray = Array.isArray(options.types);
    let cursor = await keyIdx.openCursor(options.key);
    while (cursor) {
      if (cursor.value) {
        const logEntry = cursor.value as LogEntry<Types>;
        if ((isTypesArray && (options.types as Array<Types>).indexOf(logEntry.type) >= 0) ||
            logEntry.type === options.types) {
          requests.push(cursor.delete());
        }
      }

      cursor = await cursor.continue();
    }

    await Promise.all(requests);
  }

  private async getWritableObjectStore(): Promise<ObjectStore> {
    return (await this._context.write(IdbLogger.OBJECT_STORE)).objectStore(IdbLogger.OBJECT_STORE);
  }
}
