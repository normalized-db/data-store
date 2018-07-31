import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { BaseEvent } from '../../event/base-event';
import { CreatedEvent } from '../../event/created-event';
import { RemovedEvent } from '../../event/removed-event';
import { DataStoreTypes } from '../../model/data-store-types';
import { Parent } from '../../model/parent';
import { LogAction } from './log-action';

export class LogEntry<Types extends DataStoreTypes> {

  public readonly id: number;
  public readonly time: Date;
  public readonly action: LogAction;

  public readonly type: Types;
  public readonly key: ValidKey;

  public readonly item?: any;
  public readonly parent?: Parent;

  constructor(event: BaseEvent<Types, any>, includeData = false) {
    this.time = event.time;
    this.action = event.eventType;
    this.type = event.dataStoreType;
    this.key = event.itemKey;

    if (includeData) {
      this.item = event.item;
    }

    if (event instanceof CreatedEvent || event instanceof RemovedEvent) {
      this.parent = (event as any).parent;
    }
  }
}
