import { ListResult } from '../list-result/list-result';
import { Query } from '../query';
import { Queryable } from '../queryable';
import { Mapper } from './mapper';
import { ReducerFunc } from './reduce-func';

export class Reducer<QueryResult, MapperResult, Result> implements Queryable<Result> {

  private _cachedResult?: Result;

  constructor(public readonly query: Query<QueryResult>,
              public readonly mapper: Mapper<QueryResult, MapperResult>,
              private readonly _callback: ReducerFunc<MapperResult, Result>,
              private readonly _initialValue: Result = null) {
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<Result>}
   */
  public async result(noCache = false): Promise<Result> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const parentResult = (await this.parent.result(noCache)).items;
    const parentResultLength = parentResult.length;
    let i = 0, accumulated = this._initialValue;
    while (i < parentResultLength) {
      accumulated = await this._callback(accumulated, parentResult[i], i, parentResult);
      i++;
    }

    return this._cachedResult = accumulated;
  }

  /**
   * @{inheritDoc}
   *
   * @returns {Promise<void>}
   */
  public async invalidateCachedResult(): Promise<void> {
    await this.parent.invalidateCachedResult();
    this._cachedResult = null;
  }

  public get parent(): Queryable<ListResult<any>> {
    return this.mapper || this.query;
  }

  /**
   * Returns the result of the underlying query. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<ListResponse<QueryResult>>}
   */
  public queryResult(noCache = false): Promise<ListResult<QueryResult>> {
    return this.query.result(noCache);
  }

  /**
   * Returns the result of the underlying mapper. If there is no mapper the query result will be returned instead.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<ListResult<QueryResult|MapperResult>>}
   */
  public mapResult(noCache = false): Promise<ListResult<QueryResult | MapperResult>> {
    return this.mapper ? this.mapper.result(noCache) : this.queryResult(noCache);
  }
}
