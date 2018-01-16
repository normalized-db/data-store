import { IdbContext } from '../../../context/idb-context/index';
import { InvalidQueryRunnerStatusError } from '../../../error/index';
import { QueryConfig } from '../../model/query-config';
import { IdbBaseQueryRunner } from './idb-base-query-runner';

export class IdbCountQueryRunner extends IdbBaseQueryRunner implements IdbCountQueryRunner {

  private result: number;

  constructor(context: IdbContext<any>, config: QueryConfig) {
    super(context, config);
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<number>}
   * @throws {InvalidQueryRunnerStatusError}
   */
  public async execute(): Promise<number> {
    this.start();
    this.result = 0;
    const objectStore = (await this._context.read(this._config.type)).objectStore(this._config.type);
    if (this._config.filter) {
      const requests: Promise<void>[] = [];
      let cursor = await objectStore.openCursor();
      while (cursor && cursor.value) {
        requests.push(this.processCursorValue(cursor.value));
        cursor = await cursor.continue();
      }
      await Promise.all(requests);
    } else {
      this.result = await objectStore.count();
    }

    this.stop();
    return this.result;
  }

  private async processCursorValue(value: any): Promise<void> {
    let isValid: boolean;
    if (this._config.filter.requiresDenormalization) {
      const denormalizedData = await this._denormalizer.apply<any>(this._config.type, value, this._config.depth);
      isValid = await this._config.filter.test(denormalizedData);
    } else {
      isValid = await this._config.filter.test(value);
    }

    if (isValid) {
      this.result++;
    }
  }
}
