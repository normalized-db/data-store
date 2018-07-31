import { ValidKey } from '@normalized-db/core';
import { EventType } from '../../event/utility/event-type';
import { DataStoreTypes } from '../../model/data-store-types';
import { LogMode } from '../model/log-mode';

export class LogConfig<Types extends DataStoreTypes> {

  constructor(public readonly eventType?: EventType | EventType[],
              public readonly dataStoreType?: Types | Types[],
              public readonly itemKey?: ValidKey | ValidKey[],
              public readonly mode?: LogMode) {
  }
}
