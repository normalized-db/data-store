import { ValidKey } from '@normalized-db/core';
import { EventType } from '../../event/utility/event-type';
import { DataStoreTypes } from '../../model/data-store-types';
import { LogMode } from '../model/log-mode';
import { LogConfig } from './log-config';

export class LogConfigBuilder<Types extends DataStoreTypes> {

  private _eventType: EventType | EventType[];
  private _dataStoreType: Types | Types[];
  private _itemKey: ValidKey | ValidKey[];
  private _mode: LogMode;

  public eventType(value: EventType | EventType[]): this {
    this._eventType = value;
    return this;
  }

  public type(value: Types | Types[]): this {
    this._dataStoreType = value;
    return this;
  }

  public itemKey(value: ValidKey | ValidKey[]): this {
    this._itemKey = value;
    return this;
  }

  public mode(value: LogMode): this {
    this._mode = value;
    return this;
  }

  public build(): LogConfig<Types> {
    return new LogConfig<Types>(this._eventType, this._dataStoreType, this._itemKey, this._mode);
  }
}
