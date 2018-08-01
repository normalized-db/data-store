import { EventType, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../model/data-store-types';

export abstract class BaseEvent<Types extends DataStoreTypes, T> {

  public readonly time = new Date();

  constructor(public readonly eventType: EventType,
              public readonly dataStoreType: Types,
              public readonly item: T,
              public readonly itemKey: ValidKey) {
  }
}
