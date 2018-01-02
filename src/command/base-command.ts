import {
  InvalidTypeError, ISchema, isNull, IStore, IStoreConfig, MissingKeyError, NdbDocument, NormalizedData,
  ValidKey
} from '@normalized-db/core';
import { Context } from '../context/context';
import { EventQueue } from '../event/utility/event-queue';
import { Command } from './command';

export abstract class BaseCommand<T, Ctx extends Context<any>> implements Command<T> {

  protected readonly _typeConfig: IStore;
  protected readonly _eventQueue: EventQueue;

  constructor(protected readonly _context: Ctx,
              protected readonly _type: string,
              typeIsOptional = false) {
    this._eventQueue = new EventQueue(this._context.eventPipe);

    const schema = this.schema;

    if (!typeIsOptional && (!_type || !schema.hasType(_type))) {
      throw new InvalidTypeError(_type);
    }

    this._typeConfig = this._type ? schema.getConfig(this._type) : null;
  }

  protected get schema(): ISchema {
    return this._context.schema();
  }

  protected hasKey(item: NdbDocument, config: IStoreConfig = this._typeConfig): boolean {
    return config.key in item && !isNull(item[config.key]);
  }

  protected getKey(item: NdbDocument, config: IStoreConfig = this._typeConfig, isNullAllowed = false): ValidKey | null {
    if (!isNullAllowed && !this.hasKey(item, config)) {
      throw new MissingKeyError(this._type, config.key);
    }

    return item[config.key];
  }

  protected getTypes(normalizedData: NormalizedData): string[] {
    return Object.keys(normalizedData);
  }

  protected onSuccess(): void {
    this._eventQueue.notify();
  }
}
