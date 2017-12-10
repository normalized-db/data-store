import { Context } from '../../context/context';
import { DataStoreTypes } from '../../model/data-store-types';
import { Queryable } from '../../query/queryable';
import { LogEntry } from '../model/log-entry';
import { LogQueryConfig } from './log-query-config';

export class LogQuery<Types extends DataStoreTypes> implements Queryable<LogEntry<Types>[]> {

  private _cachedResult: LogEntry<Types>[];

  private _dateRange: IDBKeyRange;
  private _type: Types;
  private _key: string;
  private _action: string;

  constructor(protected readonly _context: Context<Types>,
              private readonly _autoCloseContext: boolean) {
  }

  public time(time: Date): LogQuery<Types> {
    this._dateRange = IDBKeyRange.only(time);
    return this;
  }

  public after(lower: Date, open = false): LogQuery<Types> {
    this._dateRange = IDBKeyRange.lowerBound(lower, open);
    return this;
  }

  public before(upper: Date, open = false): LogQuery<Types> {
    this._dateRange = IDBKeyRange.upperBound(upper, open);
    return this;
  }

  public between(lower: Date, upper: Date, lowerOpen = false, upperOpen = false): LogQuery<Types> {
    this._dateRange = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    return this;
  }

  public type(type: Types): LogQuery<Types> {
    this._type = type;
    return this;
  }

  public key(key: string): LogQuery<Types> {
    this._key = key;
    return this;
  }

  public action(action: string): LogQuery<Types> {
    this._action = action;
    return this;
  }

  public async result(noCache?: boolean): Promise<LogEntry<Types>[]> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    await this._context.open();
    const runner = this._context.logger().queryRunner(this.getQueryConfig());
    this._cachedResult = await runner.execute();
    this.autoClose();
    return this._cachedResult;
  }

  public async invalidateCachedResult(): Promise<void> {
    this._cachedResult = null;
  }

  protected getQueryConfig(): LogQueryConfig {
    return {
      dateRange: this._dateRange,
      type: this._type,
      key: this._key,
      action: this._action
    };
  }

  protected async autoClose(): Promise<void> {
    if (this._autoCloseContext) {
      await this._context.close();
    }
  }
}
