import { ValidKey } from '@normalized-db/core';
import { Context } from '../../context/context';
import { DataStoreTypes } from '../../model/data-store-types';
import { Parent } from '../../model/parent';
import { Predicate } from '../../model/predicate';
import { Queryable } from '../../query/queryable';
import { LogAction } from '../model/log-action';
import { LogEntry } from '../model/log-entry';
import { LogQueryConfig } from './log-query-config';

export class LogQuery<Types extends DataStoreTypes> implements Queryable<LogEntry<Types>[]> {

  private _cachedResult: LogEntry<Types>[];

  private _dateRange: IDBKeyRange;
  private _type: Types;
  private _key: ValidKey;
  private _action: LogAction;
  private _parent: Parent;
  private _filter?: Predicate<LogEntry<Types>>;

  constructor(protected readonly _context: Context<Types>,
              private readonly _autoCloseContext: boolean) {
  }

  /**
   * Retrieve log-entries created at the given date-time.
   *
   * @param {Date} time
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public time(time: Date): this {
    this._dateRange = IDBKeyRange.only(time);
    return this;
  }

  /**
   * Retrieve log-entries created after the given date-time. If `open` is `true` the `lower`-date will be excluded,
   * it is included by default.
   *
   * @param {Date} lower
   * @param {boolean} open
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public after(lower: Date, open = false): this {
    this._dateRange = IDBKeyRange.lowerBound(lower, open);
    return this;
  }

  /**
   * Retrieve log-entries created before the given date-time. If `open` is `true` the `upper`-date will be excluded,
   * it is included by default.
   *
   * @param {Date} upper
   * @param {boolean} open
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public before(upper: Date, open = false): this {
    this._dateRange = IDBKeyRange.upperBound(upper, open);
    return this;
  }

  /**
   * Retrieve log-entries created after the given `lower`-date-time and before the given `upper`-date-time.
   * If `…Open` is `true` the related date will be excluded, both are included by default.
   *
   * @param {Date} lower
   * @param {Date} upper
   * @param {boolean} lowerOpen
   * @param {boolean} upperOpen
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public between(lower: Date, upper: Date, lowerOpen = false, upperOpen = false): this {
    this._dateRange = IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen);
    return this;
  }

  /**
   * Filter the result by the data-store-type.
   *
   * @param {Types} type
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public type(type: Types): this {
    this._type = type;
    return this;
  }

  /**
   * Filter the result by a primary-key. You probably want to use `type(…)` as well when filtering by a key.
   *
   * @param {string} key
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public key(key: ValidKey): this {
    this._key = key;
    return this;
  }

  /**
   * Filter the result by the action (e.g. `created` or `removed`).
   *
   * @param {LogAction} action
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public action(action: LogAction): this {
    this._action = action;
    return this;
  }

  /**
   * Only include log-entries with a specific `Parent`.
   *
   * @param {Parent} parent
   * @returns {LogQuery<Types extends DataStoreTypes>}
   */
  public parent(parent: Parent): this {
    this._parent = parent;
    return this;
  }

  /**
   * Filter items that shall be included into the result.
   *
   * @param {Predicate<LogEntry<Types>>} callback
   * @returns {LogQuery<LogEntry<Types>>}
   */
  public filter(callback: Predicate<LogEntry<Types>>): this {
    this._filter = callback;
    return this;
  }

  /**
   * @inheritDoc
   *
   * @param {boolean} noCache
   * @returns {Promise<LogEntry<Types extends DataStoreTypes>[]>}
   */
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

  /**
   * @inheritDoc
   *
   * @returns {Promise<void>}
   */
  public async invalidateCachedResult(): Promise<void> {
    this._cachedResult = null;
  }

  protected getQueryConfig(): LogQueryConfig {
    return {
      dateRange: this._dateRange,
      type: this._type,
      key: this._key,
      action: this._action,
      parent: this._parent,
      filter: this._filter
    };
  }

  protected async autoClose(): Promise<void> {
    if (this._autoCloseContext) {
      await this._context.close();
    }
  }
}
