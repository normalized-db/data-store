import { ClearOptions } from '../clear-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class ClearOptionsBuilder extends BaseOptionsBuilder<ClearOptions> {

  private _includeLogs: boolean;

  public includeLogs(value: boolean): this {
    this._includeLogs = value;
    return this;
  }

  public build(): ClearOptions {
    return this.assignBase({ includeLogs: this._includeLogs });
  }
}
