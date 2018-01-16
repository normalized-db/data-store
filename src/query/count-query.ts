import { Depth, NdbDocument } from '@normalized-db/core';
import { Predicate } from '../model/predicate';
import { BaseQuery } from './base-query';
import { Filter } from './model/filter';
import { QueryConfig } from './model/query-config';
import { Queryable } from './queryable';

export class CountQuery<DbItem extends NdbDocument> extends BaseQuery<number> implements Queryable<number> {

  private _filter?: Filter<DbItem>;
  private _depth: number | Depth;

  /**
   * Filter items that shall be included into the result.
   *
   * @param {Predicate<DbItem>} predicate
   * @param {boolean} requiresDenormalization
   * @returns {CountQuery<DbItem>}
   */
  public filter(predicate: Predicate<DbItem>, requiresDenormalization?: boolean): this {
    this._filter = new Filter<DbItem>(predicate, requiresDenormalization);
    return this;
  }

  /**
   * Set the `Depth` determining how far an object has to be denormalized. This is only used if the used `filter`
   * depends on denormalization.
   *
   * @param {number|Depth} depth
   * @returns {CountQuery<DbItem>}
   */
  public depth(depth: number | Depth): this {
    this._depth = depth;
    return this;
  }

  /**
   * @inheritDoc
   *
   * @param {boolean} noCache
   * @returns {Promise<number>}
   */
  public async result(noCache = false): Promise<number> {
    if (this._cachedResult && !noCache) {
      return this._cachedResult;
    }

    const runner = this._context.queryRunnerFactory().countQueryRunner(this.getQueryConfig());
    await this._context.open();
    this._cachedResult = await runner.execute();
    this.autoClose();
    return this._cachedResult;
  }

  protected getQueryConfig(): QueryConfig {
    return Object.assign({
      filter: this._filter,
      depth: this._depth
    }, super.getQueryConfig());
  }
}
