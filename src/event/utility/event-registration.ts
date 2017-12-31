import { isNull, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventType } from './event-type';
import { OnDataChanged } from './on-data-changed';

export class EventRegistration<Types extends DataStoreTypes> {

  constructor(private readonly listener: OnDataChanged,
              private eventType?: EventType | EventType[],
              private dataStoreType?: Types | Types[],
              private readonly itemKey?: ValidKey) {
  }

  public addEventType(type: EventType): void {
    if (!this.eventType) {
      this.eventType = type;
    } else if (Array.isArray(this.eventType)) {
      this.eventType.push(type);
    } else {
      this.eventType = [this.eventType, type];
    }
  }

  public removeEventType(type: EventType): void {
    if (this.eventType) {
      if (Array.isArray(this.eventType)) {
        const index = this.eventType.indexOf(type);
        if (index >= 0) {
          this.eventType.splice(index, 1);
        }
      } else if (this.eventType === type) {
        this.eventType = null;
      }
    }
  }

  public addDataStoreType(type: Types): void {
    if (!this.dataStoreType) {
      this.dataStoreType = type;
    } else if (Array.isArray(this.dataStoreType)) {
      this.dataStoreType.push(type);
    } else {
      this.dataStoreType = [this.dataStoreType, type];
    }
  }

  public removeDataStoreType(type: Types): void {
    if (this.dataStoreType) {
      if (Array.isArray(this.dataStoreType)) {
        const index = this.dataStoreType.indexOf(type);
        if (index >= 0) {
          this.dataStoreType.splice(index, 1);
        }
      } else if (this.dataStoreType === type) {
        this.dataStoreType = null;
      }
    }
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
