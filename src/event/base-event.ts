import { ValidKey } from '@normalized-db/core/lib/src/model/valid-key';
import { DataStoreTypes } from '../model/data-store-types';
import { EventType } from './utility/event-type';

export abstract class BaseEvent<Types extends DataStoreTypes, T> {

  public readonly time = new Date();

  constructor(public readonly eventType: EventType,
              public readonly dataStoreType: Types,
              public readonly item: T,
              public readonly itemKey: ValidKey) {
  }
}
