import { ISchema, isNull, IStore, IStoreConfig, NormalizedData, ValidKey } from '@normalized-db/core';
import { IdbContext } from '../context/idb-context/idb-context';
import { InvalidTypeError } from '../error/invalid-type-error';
import { MissingKeyError } from '../error/missing-key-error';
import { Command } from './command';

export abstract class BaseCommand<T> implements Command<T> {

  protected readonly _typeConfig: IStore;

  constructor(protected readonly _context: IdbContext,
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

  protected getKey(item: any, config: IStoreConfig = this._typeConfig): ValidKey {
    if (!this.hasKey(item)) {
      throw new MissingKeyError(this._type, config.key);
    }

    return item[config.key];
  }

  protected getTypes(normalizedData: NormalizedData) {
    return Object.keys(normalizedData);
  }
}