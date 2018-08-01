import { EventSelection, LogMode, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { LogConfig } from './log-config';

export class LogConfigBuilder<Types extends DataStoreTypes> {

  private _eventSelection: EventSelection;
  private _dataStoreType: Types | Types[];
  private _itemKey: ValidKey | ValidKey[];
  private _mode: LogMode;

  public eventType(value: EventSelection): this {
    this._eventSelection = value;
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
    return new LogConfig<Types>(this._eventSelection, this._dataStoreType, this._itemKey, this._mode);
  }
}
