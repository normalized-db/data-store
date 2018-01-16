import { InvalidTypeError, ISchema } from '@normalized-db/core';
import { Context } from '../context/context';
import { QueryConfig } from './model/query-config';
import { Queryable } from './queryable';

export abstract class BaseQuery<Result> implements Queryable<Result> {

  protected _cachedResult?: Result;

  constructor(protected readonly _context: Context<any>,
              private readonly _autoCloseContext: boolean,
              protected readonly _type: string) {
    if (!this.schema.hasType(_type)) {
      throw new InvalidTypeError(_type);
    }
  }

  /**
   * @{inheritDoc}
   */
  public abstract result(noCache?: boolean): Promise<Result>;

  /**
   * @{inheritDoc}
   */
  public async invalidateCachedResult(): Promise<void> {
    this._cachedResult = null;
  }

  protected getQueryConfig(): QueryConfig {
    return { type: this._type };
  }

  protected get schema(): ISchema {
    return this._context.schema();
  }

  protected async autoClose(): Promise<void> {
    if (this._autoCloseContext) {
      await this._context.close();
    }
  }
}
