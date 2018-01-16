import { Depth, NdbDocument, RefsUtility, ValidKey } from '@normalized-db/core';
import { EmptyResultError } from '../error/empty-result-error';
import { Parent } from '../model/parent';
import { Predicate } from '../model/predicate';
import { BaseQuery } from './base-query';
import { ListResult } from './list-result/list-result';
import { MapFunc } from './map-reduce/map-func';
import { Mapper } from './map-reduce/mapper';
import { ReducerFunc } from './map-reduce/reduce-func';
import { Reducer } from './map-reduce/reducer';
import { Filter } from './model/filter';
import { OrderBy } from './model/order-by';
import { QueryConfig } from './model/query-config';
import { Queryable } from './queryable';

export class Query<DbItem extends NdbDocument>
    extends BaseQuery<ListResult<DbItem>>
    implements Queryable<ListResult<DbItem>> {

  private _offset?: number;
  private _limit?: number;
  private _keys?: ValidKey[];
  private _filter?: Filter<DbItem>;
  private _orderBy?: OrderBy;
  private _parent?: Parent;
  private _depth: number | Depth;

  /**
   * Index of the first item that shall be included into the result.
   *
   * @param {number} offset
   * @returns {Query<DbItem>}
   */
  public offset(offset: number): this {
    this._offset = Math.max(offset, 0);
    return this;
  }

  /**
   * Maximum length of the result.
   *
   * @param {number} limit
   * @returns {Query<DbItem>}
   */
  public limit(limit: number): this {
    this._limit = limit;
    return this;
  }

  /**
   * Filter the result by keys.
   *
   * @param {ValidKey[]} keys
   * @returns {Query<DbItem>}
   */
  public keys(keys: ValidKey[]): this {
    this._keys = keys;
    return this;
  }

  /**
   * Filter items that shall be included into the result.
   *
   * @param {Predicate<DbItem>} predicate
   * @param {boolean} requiresDenormalization
   * @returns {Query<DbItem>}
   */
  public filter(predicate: Predicate<DbItem>, requiresDenormalization?: boolean): this {
    this._filter = new Filter<DbItem>(predicate, requiresDenormalization);
    return this;
  }

  /**
   * Define sort orders for the items in the result. Each key of `orderBy` must equal the name of a field of `DbItem`,
   * allowed values are numbers, booleans, strings, Dates and Arrays.
   * Sorting by nested documents is also possible by separating the fields by a dot,
   * e.g. `{ subDocument.foo: ORDER_ASC }`, which would sort the outer documents by the `foo`-field of `subDocument`.
   * If the key points to an array, then the items will be sorted by the length of that array.
   *
   * @param {OrderBy} orderBy
   * @returns {this}
   */
  public orderBy(orderBy: OrderBy): this {
    this._orderBy = orderBy;
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
  public nested(key: ValidKey, field: string): this {
    this._parent = new Parent(this._type, key, field);
    return this;
  }

  /**
   * Filter by reverse keys set in `sourceItem._refs[type]`. Uses the queries `keys`-filter hence `keys(…)` and
   * `reverse(…)` must not be used within in the same query.
   *
   * @param {NdbDocument} sourceItem
   * @returns {Query<DbItem>}
   */
  public reverse(sourceItem: NdbDocument): this {
    this._keys = RefsUtility.getAll(sourceItem, this._type);
    return this;
  }

  /**
   * Set the `Depth` determining how far an object has to be denormalized.
   *
   * @param {number|Depth} depth
   * @returns {Query<DbItem>}
   */
  public depth(depth: number | Depth): this {
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
   * @returns {Reducer<DbItem, void, Result>}
   */
  public reduce<Result>(callback: ReducerFunc<DbItem, Result>, initialValue?: Result): Reducer<DbItem, DbItem, Result> {
    return new Reducer<DbItem, DbItem, Result>(this, null, callback, initialValue);
  }

  /**
   * @inheritDoc
   *
   * @param {boolean} noCache
   * @returns {Promise<ListResult<DbItem>>}
   */
  public async result(noCache = false): Promise<ListResult<DbItem>> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const runner = this._context.queryRunnerFactory().queryRunner<DbItem>(this.getQueryConfig());
    await this._context.open();
    this._cachedResult = (await runner.execute()) || new ListResult<DbItem>();
    this.autoClose();
    return this._cachedResult;
  }

  /**
   * Number of items in the result. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<number>}
   */
  public async count(noCache = false): Promise<number> {
    return (await this.result(noCache)).total;
  }

  /**
   * Returns `true` if `Query.count(…)` returns a value greater than zero.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<boolean>}
   */
  public async isEmpty(noCache = false): Promise<boolean> {
    return (await this.count(noCache)) === 0;
  }

  /**
   * Returns the first item in the result. If the result is empty an `EmptyResultError` will be thrown.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<DbItem>}
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
   * @returns {Promise<DbItem|null>}
   */
  public async firstOrDefault(defaultResult: DbItem = null, noCache = false): Promise<DbItem | null> {
    return (await this.isEmpty(noCache)) ? defaultResult : this._cachedResult[0];
  }

  protected getQueryConfig(): QueryConfig {
    return Object.assign({
      offset: this._offset || QueryConfig.DEFAULT_OFFSET,
      limit: this._limit || QueryConfig.DEFAULT_LIMIT,
      keys: this._keys,
      filter: this._filter,
      orderBy: this._orderBy,
      parent: this._parent,
      depth: this._depth
    }, super.getQueryConfig());
  }
}
