import { Depth, isNull, NdbDocument, NotFoundError, RefsUtility, ValidKey } from '@normalized-db/core';
import { Context } from '../context/context';
import { ChildNotFoundError } from '../error/child-not-found-error';
import { RefNotFoundError } from '../error/ref-not-found-error';
import { Parent } from '../model/parent';
import { BaseQuery } from './base-query';
import { QueryConfig } from './model/query-config';
import { Queryable } from './queryable';

export class SingleItemQuery<DbItem extends NdbDocument>
    extends BaseQuery<DbItem | null>
    implements Queryable<DbItem | null> {

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
  public nested(key: ValidKey, field: string): this {
    this._parent = new Parent(this._type, key, field);
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
  public reverse(sourceItem: NdbDocument): this {
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
  public depth(depth: number | Depth): this {
    this._depth = depth;
    return this;
  }

  /**
   * Set the default value to be returned when the item is not found in the given type or parent.
   *
   * @param {DbItem} value
   * @returns {SingleItemQuery<DbItem|null>}
   */
  public defaultValue(value: DbItem): this {
    this._default = value;
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
    const result = await this.orDefault(noCache);
    if (!result) {
      if (this._parent) {
        throw new ChildNotFoundError(this._parent, this._key);
      } else {
        throw new NotFoundError(this._type, this._key);
      }
    }

    return result;
  }

  /**
   * Fetch the query's result and return `defaultValue` if not item was found instead of throwing an error.
   *
   * @param {boolean} noCache
   * @returns {Promise<DbItem | null>}
   */
  public async orDefault(noCache = false): Promise<DbItem | null> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const runner = this._context.queryRunnerFactory().singleItemQueryRunner<DbItem>(this.getQueryConfig());
    await this._context.open();
    this._cachedResult = (await runner.execute()) || this._default;
    this.autoClose();
    return this._cachedResult;
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
