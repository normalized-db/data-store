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

  constructor(protected readonly _context: Ctx) {
    this._eventPipe = this._context.eventPipe;
  }

  public enable(logConfig?: LogConfig<Types>): EventRegistration<Types> {
    const eventRegistrationBuilder = this._eventPipe.register(this);
    if (logConfig) {
      eventRegistrationBuilder.eventType(logConfig.eventType)
          .type(logConfig.dataStoreType)
          .itemKey(logConfig.itemKey);
    }

    return eventRegistrationBuilder.build();
  }

  public disable(): void {
    this._eventPipe.unregister(this);
  }

  public logs(autoCloseContext = true): LogQuery<Types> {
    return new LogQuery(this._context, autoCloseContext);
  }

  public abstract queryRunner(config: LogQueryConfig): LogQueryRunner<Types>;

  public abstract ndbOnDataChanged(event: BaseEvent<Types, any>): void | Promise<void>;

  public abstract clear(options?: ClearLogsOptions<Types>): Promise<boolean>;
}
