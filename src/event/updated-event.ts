import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { BaseEvent } from './base-event';

export class UpdatedEvent<T> extends BaseEvent<T> {

  constructor(type: string, item: T, itemKey: ValidKey) {
    super('removed', type, item, itemKey);
  }
}
