import { EventType, LogMode } from '@normalized-db/core';
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

  protected _config: LogConfig<Types>;

  private readonly _eventPipe: EventPipe<Types>;
  private readonly _schemaLogConfig: SchemaLogConfig;

  constructor(protected readonly _context: Ctx) {
    this._eventPipe = this._context.eventPipe;
    this._schemaLogConfig = this._context.schema().getLogConfig();
  }

  /**
   *
   * @param enable
   */
  public enable(enable?: boolean | LogConfig<Types>): EventRegistration<Types> | undefined {
    this._config = typeof enable === 'object' ? enable : undefined;

    let registration: EventRegistration<Types>;
    if (enable && (!this._config || this._config.mode !== LogMode.Disabled)) {
      const eventRegistrationBuilder = this._eventPipe.register(this);
      if (this._config) {
        eventRegistrationBuilder.eventType(this._config.eventType)
            .type(this._config.dataStoreType)
            .itemKey(this._config.itemKey);
      }

      registration = eventRegistrationBuilder.build();
    }

    return registration;
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

  protected isLoggingEnabled(type: Types, eventType: EventType): boolean {
    return this._schemaLogConfig.isLoggingEnabled(type, eventType);
  }
}
