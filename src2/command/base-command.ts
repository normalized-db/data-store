import { ISchema, isNull, IStoreConfig, ValidKey } from '@normalized-db/core';
import { IdbContext } from '../context/idb-context';
import { InvalidTypeError } from '../error/invalid-type-error';
import { MissingKeyError } from '../error/missing-key-error';
import { Command } from './command';

export abstract class BaseCommand<T> implements Command<T> {

  protected readonly _typeConfig: IStoreConfig;

  constructor(protected readonly _context: IdbContext,
              protected readonly _type: string) {
    const schema = this.schema;
    if (!schema.hasType(_type)) {
      throw new InvalidTypeError(_type);
    }

    this._typeConfig = schema.getConfig(this._type);
  }

  public abstract execute(item: T): Promise<boolean>;

  protected hasKey(item: any): boolean {
    return this._typeConfig.key in item && !isNull(item[this._typeConfig.key]);
  }

  protected getKey(item: any): ValidKey {
    if (!this.hasKey(item)) {
      throw new MissingKeyError(this._type, this._typeConfig.key);
    }

    return item[this._typeConfig.key];
  }

  private get schema(): ISchema {
    return this._context.schema();
  }
}
