import { ListenerRegisteredError } from '../../error/listener-registered-error';
import { DataStoreTypes } from '../../model/data-store-types';
import { EventRegistration } from './event-registration';
import { EventType } from './event-type';
import { OnDataChanged } from './on-data-changed';

export class EventRegistrationBuilder<Types extends DataStoreTypes> {

  private _eventType: EventType | EventType[];
  private _dataStoreType: Types | Types[];

  constructor(private readonly registrations: Map<OnDataChanged, EventRegistration<Types>>,
              private readonly listener: OnDataChanged) {
    if (this.registrations.has(listener)) {
      throw new ListenerRegisteredError();
    }
  }

  public eventType(value: EventType | EventType[]): EventRegistrationBuilder<Types> {
    this._eventType = value;
    return this;
  }

  public type(value: Types | Types[]): EventRegistrationBuilder<Types> {
    this._dataStoreType = value;
    return this;
  }

  public build(): EventRegistration<Types> {
    const registration = new EventRegistration<Types>(this.listener, this._eventType, this._dataStoreType);
    this.registrations.set(this.listener, registration);
    return registration;
  }
}
