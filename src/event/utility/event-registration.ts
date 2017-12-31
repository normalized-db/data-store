import { isNull, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventType } from './event-type';
import { OnDataChanged } from './on-data-changed';

export class EventRegistration<Types extends DataStoreTypes> {

  constructor(private readonly listener: OnDataChanged,
              private readonly eventType?: EventType | EventType[],
              private readonly dataStoreType?: Types | Types[],
              private readonly itemKey?: ValidKey) {
  }

  public isMatching(event: BaseEvent<Types, any>): boolean {
    if (!isNull(this.itemKey) && this.itemKey !== event.itemKey) {
      return false;
    }

    if (this.eventType) {
      if (Array.isArray(this.eventType)) {
        if (this.eventType.indexOf(event.eventType) < 0) {
          return false;
        }
      } else if (this.eventType !== event.eventType) {
        return false;
      }
    }

    if (this.dataStoreType) {
      if (Array.isArray(this.dataStoreType)) {
        if (this.dataStoreType.indexOf(event.dataStoreType) < 0) {
          return false;
        }
      } else if (this.dataStoreType !== event.dataStoreType) {
        return false;
      }
    }

    return true;
  }

  public notify(event: BaseEvent<Types, any>): void {
    this.listener.ndbOnDataChanged(event);
  }
}
