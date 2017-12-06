import {
  InvalidTypeError,
  ISchema,
  isNull,
  IStore,
  IStoreConfig,
  MissingKeyError,
  NormalizedData,
  ValidKey
} from '@normalized-db/core';
import { IdbContext } from '../context/idb-context/idb-context';
import { Command } from './command';

export abstract class BaseCommand<T> implements Command<T> {

  protected readonly _typeConfig: IStore;

  constructor(protected readonly _context: IdbContext<any>,
              protected readonly _type: string) {
    const schema = this.schema;
    if (!schema.hasType(_type)) {
      throw new InvalidTypeError(_type);
    }

    this._typeConfig = schema.getConfig(this._type);
  }

  protected get schema(): ISchema {
    return this._context.schema();
  }

  protected hasKey(item: any, config: IStoreConfig = this._typeConfig): boolean {
    return config.key in item && !isNull(item[config.key]);
  }

  protected getKey(item: any, config: IStoreConfig = this._typeConfig, isNullAllowed = false): ValidKey | null {
    if (!isNullAllowed && !this.hasKey(item, config)) {
      throw new MissingKeyError(this._type, config.key);
    }

    return item[config.key];
  }

  protected getTypes(normalizedData: NormalizedData) {
    return Object.keys(normalizedData);
  }
}
