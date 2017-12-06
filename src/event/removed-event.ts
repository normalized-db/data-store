import { Parent } from '../model/parent';
import { BaseEvent } from './base-event';

export class RemovedEvent<T> extends BaseEvent<T> {

  constructor(type: string, item: T, public readonly parent?: Parent) {
    super('removed', type, item);
  }
}
