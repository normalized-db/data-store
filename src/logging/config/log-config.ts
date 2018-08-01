import { EventType, ILogConfig, IStoreLogConfig, LogMode, StoreLogBuilder, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';

export class LogConfig<Types extends DataStoreTypes> implements ILogConfig {

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

  public getKeys(type: Types, orDefault?: ValidKey[]): ValidKey[] {
    let keys: ValidKey[];
    const config = this.getConfig(type);
    if (config) {
      keys = config.keys;
    }
    return keys && keys.length > 0 ? keys : orDefault;
  }

  public isLoggingEnabled(type: Types, eventType?: EventType, key?: ValidKey): boolean {
    const logConfig = this.getConfig(type);
    let isEnabled = logConfig && logConfig.mode !== LogMode.Disabled;
    if (isEnabled && eventType && logConfig.eventSelection) {
      isEnabled = Array.isArray(logConfig.eventSelection)
          ? logConfig.eventSelection.length === 0 || logConfig.eventSelection.indexOf(eventType) >= 0
          : logConfig.eventSelection === eventType;
    }

    if (isEnabled && key && logConfig.keys && logConfig.keys.length > 0) {
      isEnabled = logConfig.keys.indexOf(key) >= 0;
    }

    return isEnabled;
  }
}
