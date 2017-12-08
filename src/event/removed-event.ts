import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { DataStoreTypes } from '../model/data-store-types';
import { Parent } from '../model/parent';
import { BaseEvent } from './base-event';

export class RemovedEvent<Types extends DataStoreTypes, T> extends BaseEvent<Types, T> {

  constructor(type: Types, item: T, itemKey: ValidKey, public readonly parent?: Parent) {
    super('removed', type, item, itemKey);
  }
}
