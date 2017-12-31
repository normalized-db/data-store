import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventRegistration } from './event-registration';
import { EventRegistrationBuilder } from './event-registration.builder';
import { OnDataChanged } from './on-data-changed';

export class EventPipe<Types extends DataStoreTypes> {

  private readonly registrations = new Map<OnDataChanged, EventRegistration<Types>>();

  public register(listener: OnDataChanged): EventRegistrationBuilder<Types> {
    return new EventRegistrationBuilder<Types>(this.registrations, listener);
  }

  public unregister(listener: OnDataChanged): void {
    this.registrations.delete(listener);
  }

  public notify(event: BaseEvent<Types, any>): void {
    this.registrations.forEach(registration => {
      if (registration.isMatching(event)) {
        registration.notify(event);
      }
    });
  }
}
