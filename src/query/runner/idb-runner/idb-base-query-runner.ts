import { ISchema, ValidKey } from '@normalized-db/core';
import { IDenormalizer } from '@normalized-db/denormalizer';
import { IdbContext } from '../../../context/idb-context/index';
import { InvalidQueryRunnerStatusError } from '../../../error/index';
import { QueryConfig } from '../../model/query-config';

export abstract class IdbBaseQueryRunner {

  protected readonly _schema: ISchema;

  protected _isRunning = false;
  protected _denormalizer: IDenormalizer;

  constructor(protected readonly _context: IdbContext<any>,
              protected readonly _config: QueryConfig) {
    this.fetchCallback = this.fetchCallback.bind(this);
    this._schema = this._context.schema();
  }

  protected start() {
    if (this._isRunning) {
      throw new InvalidQueryRunnerStatusError('Query is already running');
    }

    this._isRunning = true;
    this._denormalizer = this._context.denormalizerBuilder()
        .fetchCallback(this.fetchCallback)
        .build();
  }

  protected stop() {
    this._isRunning = false;
  }

  protected async fetchCallback(type: string, keys: ValidKey | ValidKey[]): Promise<any | any[]> {
    const objectStore = (await this._context.read(type)).objectStore(type);
    return await (Array.isArray(keys)
        ? Promise.all(keys.map(async key => await objectStore.get(key)))
        : objectStore.get(keys));
  }
}
