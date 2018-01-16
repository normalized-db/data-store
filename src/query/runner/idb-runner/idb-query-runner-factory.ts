import { NdbDocument } from '@normalized-db/core';
import { IdbContext } from '../../../context/idb-context/idb-context';
import { QueryConfig } from '../../model/query-config';
import { CountQueryRunner } from '../count-query-runner';
import { QueryRunner } from '../query-runner';
import { QueryRunnerFactory } from '../query-runner-factory';
import { SingleItemQueryRunner } from '../single-item-query-runner';
import { IdbCountQueryRunner } from './idb-count-query-runner';
import { IdbQueryRunner } from './idb-query-runner';
import { IdbSingleItemQueryRunner } from './idb-single-item-query-runner';

export class IdbQueryRunnerFactory implements QueryRunnerFactory {

  private static _instance: IdbQueryRunnerFactory;

  public static instance(context: IdbContext<any>): IdbQueryRunnerFactory {
    if (!this._instance) {
      this._instance = new IdbQueryRunnerFactory(context);
    }

    return this._instance;
  }

  private constructor(private readonly _context: IdbContext<any>) {
  }

  public countQueryRunner(config: QueryConfig): CountQueryRunner {
    return new IdbCountQueryRunner(this._context, config);
  }

  public queryRunner<Result extends NdbDocument>(config: QueryConfig): QueryRunner<Result> {
    return new IdbQueryRunner<Result>(this._context, config);
  }

  public singleItemQueryRunner<Result extends NdbDocument>(config: QueryConfig): SingleItemQueryRunner<Result> {
    return new IdbSingleItemQueryRunner<Result>(this._context, config);
  }
}
