import { isNull, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventType } from './event-type';
import { OnDataChanged } from './on-data-changed';

export class EventRegistration<Types extends DataStoreTypes> {

  constructor(private readonly _listener: OnDataChanged,
              private _eventType?: EventType | EventType[],
              private _dataStoreType?: Types | Types[],
              private _itemKey?: ValidKey | ValidKey[]) {
  }

  public addEventType(type: EventType): void {
    if (!this._eventType) {
      this._eventType = type;
    } else if (Array.isArray(this._eventType)) {
      this._eventType.push(type);
    } else {
      this._eventType = [this._eventType, type];
    }
  }

  public removeEventType(type: EventType): void {
    if (this._eventType) {
      if (Array.isArray(this._eventType)) {
        const index = this._eventType.indexOf(type);
        if (index >= 0) {
          this._eventType.splice(index, 1);
        }
      } else if (this._eventType === type) {
        this._eventType = null;
      }
    }
  }

  public addDataStoreType(type: Types): void {
    if (!this._dataStoreType) {
      this._dataStoreType = type;
    } else if (Array.isArray(this._dataStoreType)) {
      this._dataStoreType.push(type);
    } else {
      this._dataStoreType = [this._dataStoreType, type];
    }
  }

  public removeDataStoreType(type: Types): void {
    if (this._dataStoreType) {
      if (Array.isArray(this._dataStoreType)) {
        const index = this._dataStoreType.indexOf(type);
        if (index >= 0) {
          this._dataStoreType.splice(index, 1);
        }
      } else if (this._dataStoreType === type) {
        this._dataStoreType = null;
      }
    }
  }

  public addItemKey(key: ValidKey): void {
    if (!this._itemKey) {
      this._itemKey = key;
    } else if (Array.isArray(this._itemKey)) {
      this._itemKey.push(key);
    } else {
      this._itemKey = [this._itemKey, key];
    }
  }

  public removeItemKey(key: ValidKey): void {
    if (this._itemKey) {
      if (Array.isArray(this._itemKey)) {
        const index = this._itemKey.indexOf(key);
        if (index >= 0) {
          this._itemKey.splice(index, 1);
        }
      } else if (this._itemKey === key) {
        this._itemKey = null;
      }
    }
  }

  public isMatching(event: BaseEvent<Types, any>): boolean {
    if (!isNull(this._itemKey)) {
      if (Array.isArray(this._itemKey)) {
        if (this._itemKey.indexOf(event.itemKey) < 0) {
          return false;
        }
      } else if (this._itemKey !== event.itemKey) {
        return false;
      }
    }

    if (this._eventType) {
      if (Array.isArray(this._eventType)) {
        if (this._eventType.indexOf(event.eventType) < 0) {
          return false;
        }
      } else if (this._eventType !== event.eventType) {
        return false;
      }
    }

    if (this._dataStoreType) {
      if (Array.isArray(this._dataStoreType)) {
        if (this._dataStoreType.indexOf(event.dataStoreType) < 0) {
          return false;
        }
      } else if (this._dataStoreType !== event.dataStoreType) {
        return false;
      }
    }

    return true;
  }

  public notify(event: BaseEvent<Types, any>): void {
    this._listener.ndbOnDataChanged(event);
  }
}
