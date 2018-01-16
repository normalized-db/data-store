import { ISchema, ISchemaConfig, Schema } from '@normalized-db/core';
import { IDenormalizerBuilder } from '@normalized-db/denormalizer';
import { INormalizerBuilder } from '@normalized-db/normalizer';
import { DataStoreTypes } from '../model/data-store-types';
import { Context } from './context';

export abstract class ContextBuilder<Types extends DataStoreTypes, Ctx extends Context<Types>> {

  protected _schema: ISchema;
  protected _normalizerBuilder: INormalizerBuilder;
  protected _denormalizerBuilder: IDenormalizerBuilder;
  protected _isLoggingEnabled = false;

  public schema(value: ISchema): this {
    this._schema = value;
    return this;
  }

  public schemaConfig(value: ISchemaConfig): this {
    this._schema = new Schema(value);
    return this;
  }

  public normalizerBuilder(value: INormalizerBuilder): this {
    this._normalizerBuilder = value;
    return this;
  }

  public denormalizerBuilder(value: IDenormalizerBuilder): this {
    this._denormalizerBuilder = value;
    return this;
  }

  public enableLogging(value: boolean): this {
    this._isLoggingEnabled = value;
    return this;
  }

  public abstract build(): Ctx;
}