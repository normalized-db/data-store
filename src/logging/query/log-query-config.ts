import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { LogAction } from '../model/log-action';

export class LogQueryConfig {

  public dateRange?: IDBKeyRange;
  public type?: string;
  public key?: ValidKey;
  public action?: LogAction;
}
