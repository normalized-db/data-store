export interface Queryable<Result> {

  /**
   * Execute the query. If `noCache` is `true` the query will be re-run.
   *
   * @param {boolean} noCache
   * @returns {Result}
   */
  result(noCache?: boolean): Promise<Result>;

  /**
   * Delete any cached results.
   *
   * @returns {Promise<void>}
   */
  invalidateCachedResult(): Promise<void>;
}
