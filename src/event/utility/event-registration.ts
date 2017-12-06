import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventType } from './event-type';
import { OnDataChanged } from './on-data-changed';

export class EventRegistration<Types extends DataStoreTypes> {

  constructor(private readonly listener: OnDataChanged,
              private readonly eventType?: EventType,
              private readonly dataStoreType?: Types) {
  }

  public isMatching(event: BaseEvent<any>): boolean {
    return (!this.eventType || this.eventType === event.eventType) &&
      (!this.dataStoreType || this.dataStoreType === event.dataStoreType);
  }

  public notify(event: BaseEvent<any>): void {
    this.listener.ndbOnDataChanged(event);
  }
}
