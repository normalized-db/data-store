import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventRegistration } from './event-registration';
import { EventRegistrationBuilder } from './event-registration.builder';
import { OnDataChanged } from './on-data-changed';

export class EventPipe<Types extends DataStoreTypes> {

  private readonly _registrations = new Map<OnDataChanged, EventRegistration<Types>>();

  public register(listener: OnDataChanged): EventRegistrationBuilder<Types> {
    return new EventRegistrationBuilder<Types>(this._registrations, listener);
  }

  public unregister(listener: OnDataChanged): void {
    this._registrations.delete(listener);
  }

  public notify(event: BaseEvent<Types, any>): void {
    this._registrations.forEach(registration => {
      if (registration.isMatching(event)) {
        registration.notify(event);
      }
    });
  }
}
