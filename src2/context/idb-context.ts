import { ISchema } from '@normalized-db/core';
import { IDenormalizer } from '@normalized-db/denormalizer';
import { INormalizer } from '@normalized-db/normalizer';
import { DB, default as DBFactory, Transaction, UpgradeDB } from 'idb';
import { QueryConfig } from '../query/query-config';
import { IdbQueryRunner } from '../query/runner/idb-query-runner';
import { QueryRunner } from '../query/runner/query-runner';
import { Context } from './context';

export interface IdbConfig {
  name: string;
  version: number;
  upgrade?: (UpgradeDB) => void;
}

export class IdbContext extends Context {

  protected _isReady = false;

  private _db: DB;

  constructor(schema: ISchema,
              normalizer: INormalizer,
              denormalizer: IDenormalizer,
              private readonly dbConfig: IdbConfig) {
    super(schema, normalizer, denormalizer);

    this.onUpgradeNeeded = this.onUpgradeNeeded.bind(this);
  }

  public async init(): Promise<void> {
    this._db = await DBFactory.open(
      this.dbConfig.name,
      this.dbConfig.version,
      this.dbConfig.upgrade || this.onUpgradeNeeded
    );

    this._isReady = true;
  }

  public queryRunner<Result>(config: QueryConfig): QueryRunner<Result> {
    return new IdbQueryRunner<Result>(this, config);
  }

  public read(stores: string | string[] = this._schema.getTypes()): Transaction {
    return this._db.transaction(stores, 'readonly');
  }

  public write(stores: string | string[] = this._schema.getTypes()): Transaction {
    return this._db.transaction(stores, 'readwrite');
  }

  private onUpgradeNeeded(upgradeDb: UpgradeDB) {
    this._schema.getTypes().forEach(type => {
      const config = this._schema.getConfig(type);
      upgradeDb.createObjectStore(type, { keyPath: config.key });
    });
  }
}
