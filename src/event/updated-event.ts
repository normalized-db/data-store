import { BaseEvent } from './base-event';

export class UpdatedEvent<T> extends BaseEvent<T> {

  constructor(type: string, item: T) {
    super('removed', type, item);
  }
}
