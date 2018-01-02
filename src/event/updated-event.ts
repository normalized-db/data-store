import { NdbDocument, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../model/data-store-types';
import { BaseEvent } from './base-event';

export class UpdatedEvent<Types extends DataStoreTypes, T extends NdbDocument> extends BaseEvent<Types, T> {

  constructor(type: Types, item: T, itemKey: ValidKey) {
    super('updated', type, item, itemKey);
  }
}
