import { Depth, ValidKey } from '@normalized-db/core';
import { EmptyResultError } from '../error/empty-result-error';
import { Predicate } from '../model/predicate';
import { BaseQuery } from './base-query';
import { ListResult } from './list-result/list-result';
import { MapFunc } from './map-reduce/map-func';
import { Mapper } from './map-reduce/mapper';
import { ReducerFunc } from './map-reduce/reduce-func';
import { Reducer } from './map-reduce/reducer';
import { Parent } from './model/parent';
import { QueryConfig } from './query-config';
import { Queryable } from './queryable';

export class Query<DbItem> extends BaseQuery<ListResult<DbItem>> implements Queryable<ListResult<DbItem>> {

  private _offset?: number;
  private _limit?: number;
  private _filter?: Predicate<DbItem>;
  private _parent?: Parent;

  private _depth: number | Depth;

  /**
   * Index of the first item that shall be included into the result.
   *
   * @param {number} offset
   * @returns {Query<DbItem>}
   */
  public offset(offset: number): Query<DbItem> {
    this._offset = Math.max(offset, 0);
    return this;
  }

  /**
   * Maximum length of the result.
   *
   * @param {number} limit
   * @returns {Query<DbItem>}
   */
  public limit(limit: number): Query<DbItem> {
    this._limit = limit;
    return this;
  }

  /**
   * Filter items that shall be included into the result.
   *
   * @param {Predicate<DbItem>} callback
   * @returns {Query<DbItem>}
   */
  public filter(callback: Predicate<DbItem>): Query<DbItem> {
    this._filter = callback;
    return this;
  }

  /**
   * Set the parent-object which is supposed to contain a reference on the object of interest.
   * The `type` argument of the queries constructor determines the type of the parent.
   *
   * @param {ValidKey} key
   * @param {string} field
   * @returns {Query<DbItem>}
   */
  public parent(key: ValidKey, field: string): Query<DbItem> {
    this._parent = new Parent(this._type, key, field);
    return this;
  }

  /**
   * Set the `Depth` determining how far an object has to be denormalized.
   *
   * @param {number|Depth} depth
   * @returns {Query<DbItem>}
   */
  public depth(depth: number | Depth): Query<DbItem> {
    this._depth = depth;
    return this;
  }

  /**
   * Manipulate every item in the result.
   *
   * @param {MapFunc<DbItem, Result>} callback
   * @returns {Mapper<DbItem, Result>}
   */
  public map<Result>(callback: MapFunc<DbItem, Result>): Mapper<DbItem, Result> {
    return new Mapper<DbItem, Result>(this, callback);
  }

  /**
   * Reduce the result.
   *
   * @param {ReducerFunc<DbItem, Result>} callback
   * @param {Result} initialValue
   * @returns {Reducer<DbItem, Result>}
   */
  public reduce<Result>(callback: ReducerFunc<DbItem, Result>, initialValue?: Result) {
    return new Reducer<DbItem, void, Result>(this, null, callback, initialValue);
  }

  /**
   * @inheritDoc
   *
   * @returns {DbItem[]}
   */
  public async result(noCache = false): Promise<ListResult<DbItem>> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const runner = this._context.queryRunner<DbItem>(this.getQueryConfig());
    this._cachedResult = await runner.execute();
  }

  /**
   * Number of items in the result. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {number}
   */
  public async count(noCache = false): Promise<number> {
    return (await this.result(noCache)).total;
  }

  /**
   * Returns `true` if `Query.count(…)` returns a value greater than zero.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {boolean}
   */
  public async isEmpty(noCache = false): Promise<boolean> {
    return (await this.count(noCache)) === 0;
  }

  /**
   * Returns the first item in the result. If the result is empty an `EmptyResultError` will be thrown.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {DbItem}
   * @throws {EmptyResultError}
   */
  public async first(noCache = false): Promise<DbItem> {
    if (await this.isEmpty(noCache)) {
      throw new EmptyResultError();
    }

    return this._cachedResult[0];
  }

  /**
   * Returns the first item in the result. If the result is empty the `defaultResult` will be returned instead.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {DbItem} defaultResult
   * @param {boolean} noCache
   * @returns {DbItem}
   */
  public async firstOrDefault(defaultResult: DbItem = null, noCache = false): Promise<DbItem | null> {
    return (await this.isEmpty(noCache)) ? defaultResult : this._cachedResult[0];
  }

  protected getQueryConfig(): QueryConfig {
    return Object.assign({
      offset: this._offset || QueryConfig.DEFAULT_OFFSET,
      limit: this._limit || QueryConfig.DEFAULT_LIMIT,
      filter: this._filter,
      parent: this._parent,
      depth: this._depth
    }, super.getQueryConfig());
  }
}
