import { UpgradeDB } from 'idb';
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
    const logStore = this._context.write(IdbLogger.OBJECT_STORE).objectStore(IdbLogger.OBJECT_STORE);
    await logStore.put(new LogEntry<Types>(event));
  }
}
