import { NdbDocument } from '@normalized-db/core';

export interface SingleItemQueryRunner<Result extends NdbDocument> {

  /**
   * Run the query based on a `QueryConfig`-object built by a `SingleItemQuery`.
   *
   * @returns {Promise<Result>}
   */
  execute(): Promise<Result>;
}
