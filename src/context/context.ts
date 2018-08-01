import { ISchema, UniqueKeyCallback, ValidKey } from '@normalized-db/core';
import { IDenormalizerBuilder } from '@normalized-db/denormalizer';
import { INormalizer, INormalizerBuilder } from '@normalized-db/normalizer';
import { CommandFactory } from '../command/command-factory';
import { EventPipe } from '../event/utility/event-pipe';
import { Logger } from '../logging/logger';
import { DataStoreTypes } from '../model/data-store-types';
import { QueryRunnerFactory } from '../query/runner/query-runner-factory';

export abstract class Context<Types extends DataStoreTypes> {

  public readonly eventPipe = new EventPipe<Types>();

  private readonly _normalizer: INormalizer;
  private readonly _uniqueKeyCallback: UniqueKeyCallback;

  protected constructor(protected readonly _schema: ISchema,
                        protected readonly _normalizerBuilder: INormalizerBuilder,
                        protected readonly _denormalizerBuilder: IDenormalizerBuilder) {
    this._normalizer = _normalizerBuilder.build();
    this._uniqueKeyCallback = this._normalizer.getUniqueKeyCallback();
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

  public newKey(type: string): ValidKey | Promise<ValidKey> | undefined {
    return this._uniqueKeyCallback ? this._uniqueKeyCallback(type) : undefined;
  }

  public abstract queryRunnerFactory(): QueryRunnerFactory;

  public abstract commandFactory(): CommandFactory;

  public abstract logger(): Logger<Types, Context<Types>>;
}
