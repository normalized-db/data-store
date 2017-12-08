import { ISchema, ValidKey } from '@normalized-db/core';
import { UniqueKeyCallback } from '@normalized-db/core/lib/src/model/unique-key-callback';
import { IDenormalizerBuilder } from '@normalized-db/denormalizer';
import { INormalizer, INormalizerBuilder } from '@normalized-db/normalizer';
import { CommandFactory } from '../command/command-factory';
import { EventPipe } from '../event/utility/event-pipe';
import { Logger } from '../logging/logger';
import { DataStoreTypes } from '../model/data-store-types';
import { QueryConfig } from '../query/query-config';
import { QueryRunner } from '../query/runner/query-runner';

export abstract class Context<Types extends DataStoreTypes> {

  public readonly eventPipe = new EventPipe<Types>();

  private readonly _normalizer: INormalizer;

  constructor(protected readonly _schema: ISchema,
              protected readonly _normalizerBuilder: INormalizerBuilder,
              protected readonly _denormalizerBuilder: IDenormalizerBuilder,
              protected readonly _keyGenerator?: UniqueKeyCallback) {
    this._normalizer = _normalizerBuilder.build();
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

  public newKey(type: string): ValidKey | null {
    return this._keyGenerator ? this._keyGenerator(type) : null;
  }

  public abstract queryRunner<Result>(config: QueryConfig): QueryRunner<Result>;

  public abstract commandFactory(): CommandFactory;

  public abstract logger(): Logger<Types, Context<Types>>;
}
