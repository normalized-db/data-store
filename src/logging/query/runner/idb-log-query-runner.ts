import { isNull } from '@normalized-db/core';
import { Cursor, ObjectStore, Transaction } from 'idb';
import { IdbContext } from '../../../context/idb-context/idb-context';
import { InvalidQueryRunnerStatusError } from '../../../error/index';
import { DataStoreTypes } from '../../../model/data-store-types';
import { IdbLogger } from '../../idb-logger';
import { LogEntry } from '../../model/log-entry';
import { LogQueryConfig } from '../log-query-config';
import { LogQueryRunner } from './log-query-runner';

export class IdbLogQueryRunner<Types extends DataStoreTypes> implements LogQueryRunner<DataStoreTypes> {

  private readonly result: LogEntry<Types>[] = [];

  private transaction: Transaction;
  private logStore: ObjectStore;

  constructor(private readonly _context: IdbContext<Types>,
              private readonly _config: LogQueryConfig) {
    this.iterateCursor = this.iterateCursor.bind(this);
  }

  public async execute(): Promise<LogEntry<Types>[]> {
    this.start();

    this._config.dateRange
      ? this.logStore.index(IdbLogger.IDX_TIME).iterateCursor(this._config.dateRange, this.iterateCursor)
      : this.logStore.iterateCursor(this.iterateCursor);

    this.stop();
    return this.result;
  }

  private start() {
    if (this.transaction) {
      throw new InvalidQueryRunnerStatusError('Log-Query is already running');
    }

    this.transaction = this._context.read(IdbLogger.OBJECT_STORE);
    this.logStore = this.transaction.objectStore(IdbLogger.OBJECT_STORE);
  }

  private iterateCursor(cursor: Cursor): void {
    if (!cursor || !cursor.value) {
      return;
    }

    // TODO make more use of indices
    const logEntry = cursor.value as LogEntry<Types>;
    const typeMatching = !this._config.type || this._config.type === logEntry.type;
    const keyMatching = isNull(this._config.key) || this._config.key === logEntry.key;
    const actionMatching = !this._config.action || this._config.action === logEntry.action;

    if (typeMatching && keyMatching && actionMatching) {
      this.result.push(logEntry);
    }

    cursor.continue();
  }

  private stop() {
    this.transaction = this.logStore = null;
  }
}
