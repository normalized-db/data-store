import { EventType } from './utility/event-type';

export abstract class BaseEvent<T> {

  public readonly time = new Date();

  constructor(public readonly eventType: EventType,
              public readonly dataStoreType: string,
              public readonly item: T) {
  }
}
