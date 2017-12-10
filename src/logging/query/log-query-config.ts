import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';

export class LogQueryConfig {

  public dateRange?: IDBKeyRange;
  public type?: string;
  public key?: ValidKey;
  public action?: string;
}
