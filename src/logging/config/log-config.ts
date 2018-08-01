import { EventSelection, LogMode, ValidKey } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';

export class LogConfig<Types extends DataStoreTypes> {

  constructor(public readonly eventType?: EventSelection,
              public readonly dataStoreType?: Types | Types[],
              public readonly itemKey?: ValidKey | ValidKey[],
              public readonly mode?: LogMode) {
  }
}
