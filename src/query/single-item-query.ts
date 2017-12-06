import { Depth, isNull, NotFoundError, RefsUtility, ValidKey } from '@normalized-db/core';
import { Context } from '../context/context';
import { ChildNotFoundError } from '../error/child-not-found-error';
import { RefNotFoundError } from '../error/ref-not-found-error';
import { Parent } from '../model/parent';
import { BaseQuery } from './base-query';
import { QueryConfig } from './query-config';
import { Queryable } from './queryable';

export class SingleItemQuery<DbItem> extends BaseQuery<DbItem | null> implements Queryable<DbItem | null> {

  private _parent?: Parent;
  private _default?: DbItem = null;

  private _depth: number | Depth;

  constructor(_context: Context<any>,
              _autoCloseContext = true,
              _type: string,
              private readonly _key: ValidKey) {
    super(_context, _autoCloseContext, _type);
  }

  /**
   * Set the parent-object which is supposed to contain a reference on the object of interest.
   * The `type` argument of the queries constructor determines the type of the parent.
   *
   * @param {ValidKey} key
   * @param {string} field
   * @returns {SingleItemQuery<DbItem|null>}
   */
  public parent(key: ValidKey, field: string): SingleItemQuery<DbItem | null> {
    this._parent = new Parent(this._type, key, field);
    return this;
  }

  /**
   * Set the default value to be returned when the item is not found in the given type or parent.
   *
   * @param {DbItem} value
   * @returns {SingleItemQuery<DbItem|null>}
   */
  public defaultValue(value: DbItem): SingleItemQuery<DbItem | null> {
    this._default = value;
    return this;
  }

  /**
   * Ensures `sourceItem` has a reverse reference an item of `type` with the `key`, throws `RefNotFoundError`
   * otherwise.
   *
   * @param sourceItem
   * @returns {SingleItemQuery<DbItem|null>}
   * @throws {RefNotFoundError}
   */
  public reverse(sourceItem: any): SingleItemQuery<DbItem | null> {
    if (!RefsUtility.hasKey(sourceItem, this._type, this._key)) {
      throw new RefNotFoundError(this._type, this._key);
    }
    return this;
  }

  /**
   * Set the `Depth` determining how far an object has to be denormalized.
   *
   * @param {number|Depth} depth
   * @returns {SingleItemQuery<DbItem|null>}
   */
  public depth(depth: number | Depth): SingleItemQuery<DbItem | null> {
    this._depth = depth;
    return this;
  }

  /**
   * @inheritDoc
   *
   * If no object with the given key was found this will either throw a `NotFoundError` or, if a `parent` was used`,
   * a `ChildNotFoundError`. If you want to use a default value instead, use `#orDefault(…)`.
   *
   * @param {boolean} noCache
   * @returns {Promise<DbItem>}
   * @throws {NotFoundError} when now `defaultValue` is available
   * @throws {ChildNotFoundError} when no `defaultValue` is available and a `parent`-item was used
   */
  public async result(noCache = false): Promise<DbItem> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const runner = this._context.queryRunner<DbItem>(this.getQueryConfig());
    await this._context.open();
    const result = await runner.singleExecute();

    if (!result) {
      if (this._parent) {
        throw new ChildNotFoundError(this._parent, this._key);
      } else {
        throw new NotFoundError(this._type, this._key);
      }
    }

    this._cachedResult = result;
    this.autoClose();
    return this._cachedResult;
  }

  /**
   * Fetch the query's result and return `defaultValue` if not item was found instead of throwing an error.
   *
   * @param {DbItem|null} defaultValue
   * @param {boolean} noCache
   * @returns {Promise<DbItem & (any | undefined)>}
   */
  public async orDefault(defaultValue: DbItem = null, noCache = false): Promise<DbItem | null> {
    let result: DbItem;
    try {
      result = await this.result(noCache);
    } catch (e) {
      // ignore
    }

    return result || defaultValue;
  }

  /**
   * Check whether an object was found or not. Returns `true` if the result is defined and not equal to the default.
   * If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Promise<boolean>}
   */
  public async hasResult(noCache = false): Promise<boolean> {
    await this.result(noCache);
    const key = this.schema.getConfig(this._type).key;
    return !isNull(this._cachedResult) && this._cachedResult[key] !== this._default[key];
  }

  protected getQueryConfig(): QueryConfig {
    return Object.assign({
      singleItem: this._key,
      parent: this._parent,
      depth: this._depth
    }, super.getQueryConfig());
  }
}
