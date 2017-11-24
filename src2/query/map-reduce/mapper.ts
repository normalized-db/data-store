import { Query } from '../query';
import { Queryable } from '../queryable';
import { MapFunc } from './map-func';
import { ReducerFunc } from './reduce-func';
import { Reducer } from './reducer';

export class Mapper<QueryResult, Result> implements Queryable<Result[]> {

  private _cachedResult?: Result[];

  constructor(private readonly _query: Query<QueryResult>,
              private readonly _callback: MapFunc<QueryResult, Result>) {
  }

  /**
   * Reduce the result.
   *
   * @param {ReducerFunc<Result, ReducerResult>} callback
   * @param {Result} initialValue
   * @returns {Reducer<Result, ReducerResult>}
   */
  public reduce<ReducerResult>(callback: ReducerFunc<Result, ReducerResult>, initialValue?: ReducerResult) {
    return new Reducer<QueryResult, Result, ReducerResult>(this._query, this, callback, initialValue);
  }

  /**
   * @inheritDoc
   *
   * @returns {Result[]}
   */
  public async result(noCache = false): Promise<Result[]> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const parentResult = await this._query.result(noCache);
    return this._cachedResult = parentResult.map(this._callback);
  }

  /**
   * @{inheritDoc}
   *
   * @returns {Promise<void>}
   */
  public async invalidateCachedResult(): Promise<void> {
    await this._query.invalidateCachedResult();
    this._cachedResult = null;
  }

  /**
   * Returns the result of the underlying query. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<any[]>}
   */
  public queryResult(noCache = false): Promise<QueryResult[]> {
    return this._query.result(noCache);
  }
}
