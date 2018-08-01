import { IStoreLogConfig } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { LogConfig } from './log-config';

export class LogConfigBuilder<Types extends DataStoreTypes> {

  private readonly _types = new Map<Types, IStoreLogConfig>();

  private _defaultConfig: IStoreLogConfig;

  public setDefault(config: IStoreLogConfig): this {
    this._defaultConfig = config;
    return this;
  }

  public hasType(type: Types): boolean {
    return this._types.has(type);
  }

  public setType(type: Types, config: IStoreLogConfig): this {
    this._types.set(type, config);
    return this;
  }

  public removeType(type: Types): this {
    this._types.delete(type);
    return this;
  }

  public build(): LogConfig<Types> {
    return new LogConfig<Types>(this._types, this._defaultConfig);
  }
}
