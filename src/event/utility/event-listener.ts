import { BaseEvent } from '../base-event';

export interface EventListener {
  ndbOnEvent(event: BaseEvent<any>): void | Promise<void>;
}
