import { EventSelection, EventType, isNull, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { OnDataChanged } from './on-data-changed';

export class EventRegistration<Types extends DataStoreTypes> {

  constructor(private readonly _listener: OnDataChanged,
              private _eventSelection?: EventSelection,
              private _dataStoreType?: Types | Types[],
              private _itemKey?: ValidKey | ValidKey[]) {
  }

  public addEventType(type: EventType): void {
    if (!this._eventSelection) {
      this._eventSelection = type;
    } else if (Array.isArray(this._eventSelection)) {
      this._eventSelection.push(type);
    } else {
      this._eventSelection = [this._eventSelection, type];
    }
  }

  public removeEventType(type: EventType): void {
    if (this._eventSelection) {
      if (Array.isArray(this._eventSelection)) {
        const index = this._eventSelection.indexOf(type);
        if (index >= 0) {
          this._eventSelection.splice(index, 1);
        }
      } else if (this._eventSelection === type) {
        this._eventSelection = undefined;
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
        this._dataStoreType = undefined;
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
        this._itemKey = undefined;
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

    if (this._eventSelection) {
      if (Array.isArray(this._eventSelection)) {
        if (this._eventSelection.indexOf(event.eventType) < 0) {
          return false;
        }
      } else if (this._eventSelection !== event.eventType) {
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
