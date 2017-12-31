import { ValidKey } from '@normalized-db/core';
import { EventType } from '../../event/utility/event-type';
import { DataStoreTypes } from '../../model/data-store-types';

export class LogConfig<Types extends DataStoreTypes> {

  constructor(public readonly eventType?: EventType | EventType[],
              public readonly dataStoreType?: Types | Types[],
              public readonly itemKey?: ValidKey | ValidKey[]) {
  }
}