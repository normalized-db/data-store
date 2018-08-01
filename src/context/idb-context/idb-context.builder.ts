import { isNull } from '@normalized-db/core';
import { DataStoreTypes } from '../../model/data-store-types';
import { ContextBuilder } from '../context.builder';
import { IdbConfig } from './idb-config';
import { IdbContext } from './idb-context';

export class IdbContextBuilder<Types extends DataStoreTypes> extends ContextBuilder<Types, IdbContext<Types>> {

  protected _dbName: string;
  protected _dbVersion: number;
  protected _dbUpgrade: (UpgradeDB) => void;

  public dbName(value: string) {
    this._dbName = value;
    return this;
  }

  public dbVersion(value: number) {
    this._dbVersion = value;
    return this;
  }

  public dbUpgrade(value: (UpgradeDB) => void) {
    this._dbUpgrade = value;
    return this;
  }

  public build(): IdbContext<Types> {
    if (!this.isValid()) {
      throw new Error(
          'Configuration for IndexedDb-Context is incomplete. Please provide a `name` and a `version` greater than 0.');
    }

    const config: IdbConfig = {
      name: this._dbName,
      version: this._dbVersion,
      upgrade: this._dbUpgrade
    };

    const context = new IdbContext<Types>(this._schema, this._normalizerBuilder, this._denormalizerBuilder, config);
    if (this._enableLogging) {
      context.logger().enable(this._enableLogging);
    }

    return context;
  }

  protected isValid(): boolean {
    return this._dbName &&
        this._dbName.length > 0 &&
        !isNull(this._dbVersion) &&
        this._dbVersion > 0;
  }
}
