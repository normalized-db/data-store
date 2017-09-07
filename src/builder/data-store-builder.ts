import { ISchema, ISchemaConfig, Schema, UniqueKeyCallback, ValidKey } from '@normalized-db/core';
import { DataStore } from '../data-store';
import { IDataStore } from '../data-store-interface';
import { InMemoryDb } from '../implementation/in-memory/in-memory-db';
import { InMemoryDbRr } from '../implementation/in-memory/in-memory-db-rr';
import { IndexedDb } from '../implementation/indexed-db/indexed-db';
import { ObservedDataStore } from '../observed-data-store';
import { IndexedDbConfig } from './model/indexed-db-config';
import { LoggingCallback } from './model/logging-callback';
import { LoggingConfig } from './model/logging-config';

export class DataStoreBuilder {

  private schema: ISchema;
  private useReverseReferences: boolean;
  private uniqueKeyCallback: UniqueKeyCallback;
  private useObservers: boolean;
  private indexedDb: IndexedDbConfig;
  private logging: LoggingConfig;

  public withSchema(schema: ISchema): DataStoreBuilder {
    this.schema = schema;
    return this;
  }

  public withSchemaConfig(schemaConfig: ISchemaConfig): DataStoreBuilder {
    this.schema = new Schema(schemaConfig);
    return this;
  }

  public withReverseReferences(useReverseReferences: boolean): DataStoreBuilder {
    this.useReverseReferences = useReverseReferences;
    return this;
  }

  public withUniqueKeyCallback(uniqueKeyCallback: UniqueKeyCallback): DataStoreBuilder {
    this.uniqueKeyCallback = uniqueKeyCallback;
    return this;
  }

  public withObservers(useObservers: boolean): DataStoreBuilder {
    this.useObservers = useObservers;
    return this;
  }

  public withIndexedDb(name: string, version: number, upgrade?: (UpgradeDB) => void): DataStoreBuilder {
    this.indexedDb = new IndexedDbConfig(name, version, upgrade);
    return this;
  }

  public withLogging(prefix?: string,
                     preCallback?: LoggingCallback<ValidKey, any>,
                     isActive: boolean = true): DataStoreBuilder {
    this.logging = new LoggingConfig(prefix, preCallback, isActive);
    return this;
  }

  public async build(): Promise<DataStore> {
    const implementation: IDataStore = this.indexedDb && this.indexedDb.isValid
      ? await this.buildIndexedDbImplementation()
      : await this.buildInMemoryImplementation();

    return this.useObservers
      ? new ObservedDataStore(this.schema, implementation, this.useReverseReferences)
      : new DataStore(this.schema, implementation, this.useReverseReferences);
  }

  protected buildIndexedDbImplementation(): Promise<IndexedDb> {
    return this.indexedDb.build(this.schema, this.useReverseReferences, this.logging);
  }

  protected async buildInMemoryImplementation(): Promise<InMemoryDb> {
    return this.useReverseReferences
      ? new InMemoryDbRr(this.schema, this.uniqueKeyCallback)
      : new InMemoryDb(this.schema, this.uniqueKeyCallback);
  }
}
