import { ISchema } from '@normalized-db/core';
import { IndexedDb } from '../../implementation/indexed-db/indexed-db';
import { IndexedDbRr } from '../../implementation/indexed-db/indexed-db-rr';
import { LoggingConfig } from './logging-config';

export class IndexedDbConfig {

  constructor(private readonly name: string,
              private readonly version: number,
              private readonly upgrade?: (UpgradeDB) => void) {
  }

  public async build(schema: ISchema,
                     useReverseReferences: boolean = false,
                     logging?: LoggingConfig): Promise<IndexedDb> {
    const normalizedDb = useReverseReferences
      ? new IndexedDbRr(schema, logging)
      : new IndexedDb(schema, logging);

    await normalizedDb.open(this.name, this.version, this.upgrade);

    return normalizedDb;
  }

  public get isValid(): boolean {
    return this.name && this.name.length > 0 && this.version && this.version > 0;
  }
}
