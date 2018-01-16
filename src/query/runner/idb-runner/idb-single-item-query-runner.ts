import { IdbContext } from '../../../context/idb-context/idb-context';
import { InvalidQueryConfigError } from '../../../error/invalid-query-config-error';
import { InvalidQueryRunnerStatusError } from '../../../error/invalid-query-runner-status-error';
import { QueryConfig } from '../../model/query-config';
import { SingleItemQueryRunner } from '../single-item-query-runner';
import { IdbBaseDocumentQueryRunner } from './idb-base-document-query-runner';

export class IdbSingleItemQueryRunner<Result>
    extends IdbBaseDocumentQueryRunner<Result>
    implements SingleItemQueryRunner<Result> {

  constructor(context: IdbContext<any>, config: QueryConfig) {
    super(context, config);
  }

  /**
   * @inheritDoc
   *
   * @returns {Promise<Result>}
   * @throws {InvalidQueryRunnerStatusError}
   */
  public async execute(): Promise<Result> {
    this.start();
    if (!this._config.singleItem) {
      throw new InvalidQueryConfigError('Primary key for `singleExecute` is missing');
    }

    let result: Result;
    if (this._config.parent) {
      result = (await this.findInParent()) as Result;
    } else {
      result = await this.findByKey();
    }

    this.stop();
    return result;
  }
}
