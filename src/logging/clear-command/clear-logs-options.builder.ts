import { ValidKey } from '@normalized-db/core';
import { BaseOptionsBuilder } from '../../data-store/options/builder/base-options.builder';
import { DataStoreTypes } from '../../model/data-store-types';
import { ClearLogsOptions } from './clear-logs-options';

export class ClearLogsOptionsBuilder<Types extends DataStoreTypes>
    extends BaseOptionsBuilder<ClearLogsOptions<Types>> {

  private _types?: Types | Types[];
  private _key?: ValidKey;

  public types(value: Types | Types[]): this {
    this._types = value;
    return this;
  }

  public key(value: ValidKey): this {
    this._key = value;
    return this;
  }

  public build(): ClearLogsOptions<Types> {
    return this.assignBase({
      types: this._types,
      key: this._key
    });
  }
}
