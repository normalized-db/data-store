import { Parent } from '../model/parent';
import { BaseEvent } from './base-event';

export class CreatedEvent<T> extends BaseEvent<T> {

  constructor(type: string, item: T, public readonly parent?: Parent) {
    super('created', type, item);
  }
}
