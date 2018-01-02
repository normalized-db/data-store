import { BaseOptions } from '../base-options';

export abstract class BaseOptionsBuilder<Options extends BaseOptions> {

  protected _autoCloseContext: boolean;

  public autoCloseContext(value: boolean): this {
    this._autoCloseContext = value;
    return this;
  }

  public abstract build(): Options;

  protected buildBase(): BaseOptions {
    return { autoCloseContext: this._autoCloseContext };
  }

  protected assignBase(options: Options): Options {
    return Object.assign(options, this.buildBase());
  }
}
