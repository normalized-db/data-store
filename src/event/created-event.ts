import { NdbDocument, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../model/data-store-types';
import { Parent } from '../model/parent';
import { BaseEvent } from './base-event';

export class CreatedEvent<Types extends DataStoreTypes, T extends NdbDocument> extends BaseEvent<Types, T> {

  constructor(type: Types, item: T, itemKey: ValidKey, public readonly parent?: Parent | Parent[]) {
    super('created', type, item, itemKey);
  }
}
