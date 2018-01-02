import { NdbDocument } from '@normalized-db/core';
import { ListResult } from '../list-result/list-result';
import { ListResultBuilder } from '../list-result/list-result.builder';
import { Query } from '../query';
import { Queryable } from '../queryable';
import { MapFunc } from './map-func';
import { ReducerFunc } from './reduce-func';
import { Reducer } from './reducer';

export class Mapper<QueryResult extends NdbDocument, Result> implements Queryable<ListResult<Result>> {

  private _cachedResult?: ListResult<Result>;

  constructor(public readonly query: Query<QueryResult>,
              private readonly _callback: MapFunc<QueryResult, Result>) {
  }

  /**
   * Reduce the result.
   *
   * @param {ReducerFunc<Result, ReducerResult>} callback
   * @param {Result} initialValue
   * @returns {Reducer<Result, ReducerResult>}
   */
  public reduce<ReducerResult>(callback: ReducerFunc<Result, ReducerResult>,
                               initialValue?: ReducerResult): Reducer<QueryResult, Result, ReducerResult> {
    return new Reducer<QueryResult, Result, ReducerResult>(this.query, this, callback, initialValue);
  }

  /**
   * @inheritDoc
   *
   * @param {boolean} noCache
   * @returns {Promise<ListResult<Result>>}
   */
  public async result(noCache = false): Promise<ListResult<Result>> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const parentResult = await this.query.result(noCache);
    return this._cachedResult = new ListResultBuilder<Result>()
        .items(await Promise.all(parentResult.items.map(this._callback)))
        .total(parentResult.total)
        .offset(parentResult.offset)
        .limit(parentResult.limit)
        .build();
  }

  /**
   * @{inheritDoc}
   *
   * @returns {Promise<void>}
   */
  public async invalidateCachedResult(): Promise<void> {
    await this.query.invalidateCachedResult();
    this._cachedResult = null;
  }

  /**
   * Returns the result of the underlying query. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<ListResult<QueryResult>>}
   */
  public queryResult(noCache = false): Promise<ListResult<QueryResult>> {
    return this.query.result(noCache);
  }
}
