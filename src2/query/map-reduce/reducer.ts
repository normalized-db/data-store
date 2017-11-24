import { Query } from '../query';
import { Queryable } from '../queryable';
import { Mapper } from './mapper';
import { ReducerFunc } from './reduce-func';

export class Reducer<QueryResult, MapperResult, Result> implements Queryable<Result> {

  private _cachedResult?: Result;

  constructor(public readonly _query: Query<QueryResult>,
              public readonly _mapper: Mapper<QueryResult, MapperResult>,
              private readonly _callback: ReducerFunc<MapperResult, Result>,
              private readonly _initialValue: Result = null) {
  }

  /**
   * @inheritDoc
   *
   * @returns {Result}
   */
  public async result(noCache = false): Promise<Result> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const parentResult = await this.parent.result(noCache);

    return this._cachedResult = parentResult.reduce<Result>(
      (result, item) => this._callback(result, item),
      this._initialValue
    );
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

  public get parent(): Queryable<any[]> {
    return this._mapper || this._query;
  }

  /**
   * Returns the result of the underlying query. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<any[]>}
   */
  public queryResult(noCache = false): Promise<any[]> {
    return this._query.result(noCache);
  }

  /**
   * Returns the result of the underlying mapper. If there is no mapper the query result will be returned instead.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<MapperResult[]>}
   */
  public mapResult(noCache = false): Promise<MapperResult[]> {
    return this._mapper ? this._mapper.result(noCache) : this.queryResult(noCache);
  }
}
