import { ISchema } from '@normalized-db/core';
import { IDenormalizer } from '@normalized-db/denormalizer';
import { INormalizer } from '@normalized-db/normalizer';
import { QueryConfig } from '../query/query-config';
import { QueryRunner } from '../query/runner/query-runner';

export abstract class Context {

  protected abstract _isReady: boolean;

  constructor(protected readonly _schema: ISchema,
              protected readonly _normalizer: INormalizer,
              protected readonly _denormalizer: IDenormalizer) {
  }

  public async init(): Promise<void> {
    // nothing to do here
  }

  public get isReady(): boolean {
    return this._isReady;
  }

  public schema(): ISchema {
    return this._schema;
  }

  public normalizer(): INormalizer {
    return this._normalizer;
  }

  public denormalizer(): IDenormalizer {
    return this._denormalizer;
  }

  public abstract queryRunner<Result>(config: QueryConfig): QueryRunner<Result>;
}
