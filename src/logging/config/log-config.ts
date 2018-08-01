import { EventType, IStoreLogConfig, LogMode, StoreLogBuilder } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';

export class LogConfig<Types extends DataStoreTypes> { // TODO `implements ILogConfig`

  private readonly _defaultConfig: IStoreLogConfig;
  private readonly _types = new Map<Types, IStoreLogConfig>();

  public constructor(types: Map<Types, IStoreLogConfig>, defaultConfig?: IStoreLogConfig) {
    this._types = types;
    this._defaultConfig = defaultConfig || new StoreLogBuilder().build();
  }

  public hasType(type: Types): boolean {
    return this._types.has(type);
  }

  public getConfig(type: Types): IStoreLogConfig {
    return this._types.get(type) || this._defaultConfig;
  }

  public getLogMode(type: Types, orDefault?: LogMode.Disabled): LogMode {
    const config = this.getConfig(type);
    return config && config.mode ? config.mode : orDefault;
  }

  public getEventTypes(type: Types, orDefault?: EventType[]): EventType[] {
    let types: EventType[];
    const config = this.getConfig(type);
    if (config) {
      const selection = Array.isArray(config.eventSelection) ? config.eventSelection : [config.eventSelection];
      types = selection.length > 0 ? selection : orDefault;
    }
    return types;
  }

  public isLoggingEnabled(type: Types, eventType?: EventType): boolean {
    const config = this.getConfig(type);
    let isEnabled = config && config.mode !== LogMode.Disabled;
    if (isEnabled && eventType) {
      isEnabled = Array.isArray(config.eventSelection)
          ? config.eventSelection.indexOf(eventType) >= 0
          : config.eventSelection === eventType;
    }

    return isEnabled;
  }
}
