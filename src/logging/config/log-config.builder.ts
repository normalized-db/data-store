import { ValidKey } from '@normalized-db/core';
import { EventType } from '../../event/utility/event-type';
import { DataStoreTypes } from '../../model/data-store-types';
import { LogConfig } from './log-config';

export class LogConfigBuilder<Types extends DataStoreTypes> {
  
  private _eventType: EventType | EventType[];
  private _dataStoreType: Types | Types[];
  private _itemKey: ValidKey | ValidKey[];

  public eventType(value: EventType | EventType[]): LogConfigBuilder<Types> {
    this._eventType = value;
    return this;
  }

  public type(value: Types | Types[]): LogConfigBuilder<Types> {
    this._dataStoreType = value;
    return this;
  }

  public itemKey(value: ValidKey | ValidKey[]): LogConfigBuilder<Types> {
    this._itemKey = value;
    return this;
  }

  public build(): LogConfig<Types> {
    return new LogConfig<Types>(this._eventType, this._dataStoreType, this._itemKey);
  }
}