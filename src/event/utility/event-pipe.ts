import { DataStoreTypes } from '../../model/data-store-types';
import { BaseEvent } from '../base-event';
import { EventListener } from './event-listener';
import { EventRegistration } from './event-registration';
import { EventRegistrationBuilder } from './event-registration.builder';

export class EventPipe<Types extends DataStoreTypes> {

  private readonly registrations = new Map<EventListener, EventRegistration<Types>>();

  public add(listener: EventListener): EventRegistrationBuilder<Types> {
    return new EventRegistrationBuilder<Types>(this.registrations, listener);
  }

  public remove(listener: EventListener): void {
    this.registrations.delete(listener);
  }

  public notify(event: BaseEvent<any>): void {
    this.registrations.forEach(registration => {
      if (registration.isMatching(event)) {
        registration.notify(event);
      }
    });
  }
}
