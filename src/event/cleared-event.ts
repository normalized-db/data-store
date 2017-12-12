import { DataStoreTypes } from '../model/data-store-types';
import { BaseEvent } from './base-event';

export class ClearedEvent<Types extends DataStoreTypes> extends BaseEvent<Types, void> {

  constructor(type: Types) {
    super('cleared', type, null, null);
  }
}
