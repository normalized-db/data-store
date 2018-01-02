import { ValidKey } from '@normalized-db/core';
import { BaseOptions } from '../../data-store/options/base-options';
import { DataStoreTypes } from '../../model/data-store-types';

export interface ClearLogsOptions<Types extends DataStoreTypes> extends BaseOptions {
  readonly types?: Types | Types[];
  readonly key?: ValidKey;
}
