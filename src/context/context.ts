import { ISchema, UniqueKeyCallback, ValidKey } from '@normalized-db/core';
import { IDenormalizerBuilder } from '@normalized-db/denormalizer';
import { INormalizer, INormalizerBuilder } from '@normalized-db/normalizer';
import { CommandFactory } from '../command/command-factory';
import { QueryConfig } from '../query/query-config';
import { QueryRunner } from '../query/runner/query-runner';

export abstract class Context {

  protected _keyGenerator: UniqueKeyCallback;

  private readonly _normalizer: INormalizer;

  constructor(protected readonly _schema: ISchema,
              normalizerBuilder: INormalizerBuilder,
              protected readonly _denormalizerBuilder: IDenormalizerBuilder) {
    this._normalizer = normalizerBuilder.build();
  }

  public abstract isReady(): boolean;

  public abstract open(): Promise<void>;

  public abstract close(): Promise<void>;

  public schema(): ISchema {
    return this._schema;
  }

  public normalizer(): INormalizer {
    return this._normalizer;
  }

  public denormalizerBuilder(): IDenormalizerBuilder {
    return this._denormalizerBuilder;
  }

  public withKeyGenerator(keyGenerator: UniqueKeyCallback) {
    this._keyGenerator = keyGenerator;
    return this;
  }

  public newKey(type: string): ValidKey | null {
    return this._keyGenerator ? this._keyGenerator(type) : null;
  }

  public abstract queryRunner<Result>(config: QueryConfig): QueryRunner<Result>;

  public abstract commandFactory(): CommandFactory;
}
