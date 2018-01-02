import { NdbDocument } from '@normalized-db/core';
import { ListResult } from '../list-result/list-result';

export interface QueryRunner<Result extends NdbDocument> {

  /**
   * Run the query based on a `QueryConfig`-object built by a `Query`.
   *
   * @returns {Promise<ListResult<Result>>}
   */
  execute(): Promise<ListResult<Result>>;
}
