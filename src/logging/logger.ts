import { Context } from '../context/context';
import { BaseEvent } from '../event/base-event';
import { EventPipe } from '../event/utility/event-pipe';
import { OnDataChanged } from '../event/utility/on-data-changed';
import { DataStoreTypes } from '../model/data-store-types';

export abstract class Logger<Types extends DataStoreTypes, Ctx extends Context<Types>> implements OnDataChanged {

  private readonly _eventPipe: EventPipe<Types>;

  constructor(protected readonly _context: Ctx) {
    this._eventPipe = this._context.eventPipe;
  }

  public enable(): void {
    // TODO enable for some types
    this._eventPipe.add(this).register();
  }

  public disable(): void {
    // TODO disable some types only
    this._eventPipe.remove(this);
  }

  public abstract ndbOnDataChanged(event: BaseEvent<Types, any>): void | Promise<void>;
}
