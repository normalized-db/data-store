import { ISchema, UniqueKeyCallback } from '@normalized-db/core';
import { IDenormalizer } from '@normalized-db/denormalizer';
import { INormalizer } from '@normalized-db/normalizer';
import { CommandFactory } from '../command/command-factory';
import { QueryConfig } from '../query/query-config';
import { QueryRunner } from '../query/runner/query-runner';

export abstract class Context {

  protected abstract _isReady: boolean;

  protected _keyGenerator: UniqueKeyCallback;

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

  public withKeyGenerator(keyGenerator: UniqueKeyCallback) {
    this._keyGenerator = keyGenerator;
    return this;
  }

  public abstract queryRunner<Result>(config: QueryConfig): QueryRunner<Result>;

  public abstract commandFactory(): CommandFactory;
}
