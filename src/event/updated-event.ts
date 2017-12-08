import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { DataStoreTypes } from '../model/data-store-types';
import { BaseEvent } from './base-event';

export class UpdatedEvent<Types extends DataStoreTypes, T> extends BaseEvent<Types, T> {

  constructor(type: Types, item: T, itemKey: ValidKey) {
    super('removed', type, item, itemKey);
  }
}
