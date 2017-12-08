import { BaseEvent } from '../base-event';
import { EventPipe } from './event-pipe';

export class EventQueue {

  private readonly _queue: BaseEvent<any, any>[] = [];

  constructor(private readonly _eventPipe: EventPipe<any>) {
  }

  public enqueue(event: BaseEvent<any, any>): void {
    this._queue.unshift(event);
  }

  public notify(): void {
    let i = this._queue.length;
    while (--i >= 0) {
      this._eventPipe.notify(this._queue.pop());
    }
  }
}
