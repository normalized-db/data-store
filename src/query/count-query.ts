import { BaseQuery } from './base-query';
import { QueryConfig } from './query-config';
import { Queryable } from './queryable';

export class CountQuery extends BaseQuery<number> implements Queryable<number> {

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

    const runner = this._context.queryRunner<number>(this.getQueryConfig());
    await this._context.open();
    this._cachedResult = await runner.count();
    this.autoClose();
    return this._cachedResult;
  }

  protected getQueryConfig(): QueryConfig {
    return Object.assign({ countOnly: true }, super.getQueryConfig());
  }
}
