import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { Parent } from '../model/parent';
import { BaseEvent } from './base-event';

export class RemovedEvent<T> extends BaseEvent<T> {

  constructor(type: string, item: T, itemKey: ValidKey, public readonly parent?: Parent) {
    super('removed', type, item, itemKey);
  }
}
