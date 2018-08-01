import { LogMode } from '@normalized-db/core';
import { UpgradeDB } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { BaseEvent } from '../../event/base-event';
import { OnDataChanged } from '../../event/utility/on-data-changed';
import { DataStoreTypes } from '../../model/data-store-types';
import { ClearLogsOptions } from '../clear-command/clear-logs-options';
import { Logger } from '../logger';
import { LogEntry } from '../model/log-entry';
import { LogQueryConfig } from '../query/log-query-config';
import { LogQueryRunner } from '../query/log-query-runner';
import { IdbClearLogsCommand } from './idb-clear-logs-command';
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
    if (!upgradeDb.objectStoreNames.contains(IdbLogger.OBJECT_STORE)) {
      const logStore = upgradeDb.createObjectStore(IdbLogger.OBJECT_STORE, { keyPath: 'id', autoIncrement: true });
      logStore.createIndex(IdbLogger.IDX_TIME, 'time');
      logStore.createIndex(IdbLogger.IDX_ACTION, 'action');
      logStore.createIndex(IdbLogger.IDX_TYPE, 'type');
      logStore.createIndex(IdbLogger.IDX_KEY, 'key');
    }
  }

  public queryRunner(config: LogQueryConfig): LogQueryRunner<Types> {
    return new IdbLogQueryRunner<Types>(this._context, config);
  }

  // TODO auto-close context - other writing commands still could need the db-connection
  public async ndbOnDataChanged(event: BaseEvent<Types, any>): Promise<void> {
    if (this.isLoggingEnabled(event.dataStoreType, event)) {
      const transaction = await this._context.write(IdbLogger.OBJECT_STORE);
      const logStore = transaction.objectStore(IdbLogger.OBJECT_STORE);
      const includeData = this.getLogMode(event.dataStoreType) === LogMode.Full;
      await logStore.put(new LogEntry<Types>(event, includeData));
    }
  }

  public async clear(options?: ClearLogsOptions<Types>): Promise<boolean> {
    const cmd = new IdbClearLogsCommand<Types>(this._context);
    const success = await cmd.execute(options);
    this.autoCloseContext(options);
    return success;
  }

  private async autoCloseContext(options: ClearLogsOptions<Types>): Promise<void> {
    if (options && options.autoCloseContext) {
      await this._context.close();
    }
  }
}
