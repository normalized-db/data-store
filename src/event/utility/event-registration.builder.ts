import { ListenerRegisteredError } from '../../error/listener-registered-error';
import { DataStoreTypes } from '../../model/data-store-types';
import { EventListener } from './event-listener';
import { EventRegistration } from './event-registration';
import { EventType } from './event-type';

export class EventRegistrationBuilder<Types extends DataStoreTypes> {

  private _dataStoreType: Types;
  private _eventType: EventType;

  constructor(private readonly registrations: Map<EventListener, EventRegistration<Types>>,
              private readonly listener: EventListener) {
    if (this.registrations.has(listener)) {
      throw new ListenerRegisteredError();
    }
  }

  public type(value: Types): EventRegistrationBuilder<Types> {
    this._dataStoreType = value;
    return this;
  }

  public eventType(value: EventType): EventRegistrationBuilder<Types> {
    this._eventType = value;
    return this;
  }

  public register(): void {
    this.registrations.set(this.listener, new EventRegistration(this.listener, this._eventType, this._dataStoreType));
  }
}
