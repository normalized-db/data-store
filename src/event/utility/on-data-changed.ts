import { BaseEvent } from '../base-event';

export interface OnDataChanged {
  ndbOnDataChanged(event: BaseEvent<any>): void | Promise<void>;
}
