import { LogMode } from '@normalized-db/core';
import { SchemaLogConfig } from '@normalized-db/core/lib/src/schema/schema-log-config';
import { Context } from '../context/context';
import { BaseEvent } from '../event/base-event';
import { EventPipe } from '../event/utility/event-pipe';
import { EventRegistration } from '../event/utility/event-registration';
import { OnDataChanged } from '../event/utility/on-data-changed';
import { DataStoreTypes } from '../model/data-store-types';
import { ClearLogsOptions } from './clear-command/clear-logs-options';
import { LogConfig } from './config/log-config';
import { LogQuery } from './query/log-query';
import { LogQueryConfig } from './query/log-query-config';
import { LogQueryRunner } from './query/log-query-runner';

export abstract class Logger<Types extends DataStoreTypes, Ctx extends Context<Types>> implements OnDataChanged {

  private readonly _eventPipe: EventPipe<Types>;
  private readonly _schemaLogConfig: SchemaLogConfig;

  private _config: LogConfig<Types>;

  constructor(protected readonly _context: Ctx) {
    this._eventPipe = this._context.eventPipe;
    this._schemaLogConfig = this._context.schema().getLogConfig();
  }

  /**
   *
   * @param enable
   */
  public enable(enable?: boolean | LogConfig<Types>): EventRegistration<Types> | undefined {
    if (enable !== false) {
      this._config = typeof enable === 'object' ? enable : undefined;
      /*
       * TODO register only for those events needed to log all entities with logging enabled
       * (consider both, _config and _schemaLogConfig, simplify `isLoggingEnabled` / `getLogMode` and their usages)
       */
      return this._eventPipe.register(this).build();
    } else {
      this.disable();
      return undefined;
    }
  }

  public disable(): void {
    this._config = undefined;
    this._eventPipe.unregister(this);
  }

  public logs(autoCloseContext = true): LogQuery<Types> {
    return new LogQuery(this._context, autoCloseContext);
  }

  public abstract queryRunner(config: LogQueryConfig): LogQueryRunner<Types>;

  public abstract ndbOnDataChanged(event: BaseEvent<Types, any>): void | Promise<void>;

  public abstract clear(options?: ClearLogsOptions<Types>): Promise<boolean>;

  protected isLoggingEnabled(type: Types, event: BaseEvent<Types, any>): boolean {
    return this._config
        ? this._config.isLoggingEnabled(type, event.eventType, event.itemKey)
        : this._schemaLogConfig.isLoggingEnabled(type, event.eventType, event.itemKey);
  }

  protected getLogMode(type: Types): LogMode {
    return this._config
        ? this._config.getLogMode(type)
        : this._schemaLogConfig.getLogMode(type);
  }
}
