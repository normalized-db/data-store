import { DataStoreTypes } from '../../model/data-store-types';
import { ClearLogsOptions } from './clear-logs-options';

export interface ClearLogsCommand<Types extends DataStoreTypes> {

  execute(options?: ClearLogsOptions<Types>): Promise<boolean>;
}
