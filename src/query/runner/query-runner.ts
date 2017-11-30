import { ListResult } from '../list-result/list-result';

export interface QueryRunner<Result> {

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
