import { DataStoreTypes } from '../../model/data-store-types';
import { LogEntry } from '../model/log-entry';

export interface LogQueryRunner<Types extends DataStoreTypes> {

  execute(): Promise<LogEntry<Types>[]>;
}
