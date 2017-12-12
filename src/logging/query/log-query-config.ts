import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { Predicate } from '../../model/predicate';
import { LogAction } from '../model/log-action';
import { LogEntry } from '../model/log-entry';

export class LogQueryConfig {

  public dateRange?: IDBKeyRange;
  public type?: string;
  public key?: ValidKey;
  public action?: LogAction;
  public filter?: Predicate<LogEntry<any>>;
}
