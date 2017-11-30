import { ListResult } from '../list-result/list-result';

export interface QueryRunner<Result> {

  /**
   * Returns the total count of items in the given type. Any other configuration is ignored.
   *
   * @returns {Promise<number>}
   */
  count(): Promise<number>;

  /**
   * Run the query based on a `QueryConfig`-object built by a `Query`.
   *
   * @returns {Promise<ListResult<Result>>}
   */
  execute(): Promise<ListResult<Result>>;

  /**
   * Run the query based on a `QueryConfig`-object built by a `SingleItemQuery`.
   *
   * @returns {Promise<Result>}
   */
  singleExecute(): Promise<Result>;
}
