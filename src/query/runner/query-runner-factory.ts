import { NdbDocument } from '@normalized-db/core';
import { QueryConfig } from '../model/query-config';
import { CountQueryRunner } from './count-query-runner';
import { QueryRunner } from './query-runner';
import { SingleItemQueryRunner } from './single-item-query-runner';

export interface QueryRunnerFactory {

  countQueryRunner(config: QueryConfig): CountQueryRunner;

  queryRunner<Result extends NdbDocument>(config: QueryConfig): QueryRunner<Result>;

  singleItemQueryRunner<Result extends NdbDocument>(config: QueryConfig): SingleItemQueryRunner<Result>;
}
