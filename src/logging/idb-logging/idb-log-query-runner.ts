import { isNull } from '@normalized-db/core';
import { ObjectStore, Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { InvalidQueryRunnerStatusError } from '../../error/index';
import { DataStoreTypes } from '../../model/data-store-types';
import { LogEntry } from '../model/log-entry';
import { LogQueryConfig } from '../query/log-query-config';
import { LogQueryRunner } from '../query/log-query-runner';
import { IdbLogger } from './idb-logger';

export class IdbLogQueryRunner<Types extends DataStoreTypes> implements LogQueryRunner<DataStoreTypes> {

  private readonly result: LogEntry<Types>[] = [];

  private transaction: Transaction;
  private logStore: ObjectStore;

  constructor(private readonly _context: IdbContext<Types>,
              private readonly _config: LogQueryConfig) {
  }

  public async execute(): Promise<LogEntry<Types>[]> {
    await this.start();

    let cursor = await (this._config.dateRange
      ? this.logStore.index(IdbLogger.IDX_TIME).openCursor(this._config.dateRange)
      : this.logStore.openCursor());

    const requests: Promise<void>[] = [];
    while (cursor) {
      if (cursor.value) {
        requests.push(this.validate(cursor.value as LogEntry<Types>));
      }
      cursor = await cursor.continue();
    }

    await Promise.all(requests);
    this.stop();
    return this.result;
  }

  private async start(): Promise<void> {
    if (this.transaction) {
      throw new InvalidQueryRunnerStatusError('Log-Query is already running');
    }

    this.transaction = await this._context.read(IdbLogger.OBJECT_STORE);
    this.logStore = this.transaction.objectStore(IdbLogger.OBJECT_STORE);
  }

  private stop(): void {
    this.transaction = this.logStore = null;
  }

  private async validate(logEntry: LogEntry<Types>): Promise<void> {
    // TODO make more use of indices
    if (!this._config.type || this._config.type === logEntry.type) { // type matching
      if (isNull(this._config.key) || this._config.key === logEntry.key) { // key matching
        if (!this._config.action || this._config.action === logEntry.action) { // action matching
          if (!this._config.parent || this._config.parent.equals(logEntry.parent)) {
            if (!this._config.filter || this._config.filter(logEntry)) { // filter-predicate matching
              this.result.push(logEntry);
            }
          }
        }
      }
    }
  }
}
