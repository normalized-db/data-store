import { PutOptions } from '../put-options';
import { UpdateOptions } from '../update-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class UpdateOptionsBuilder extends BaseOptionsBuilder<UpdateOptions> {

  private _isPartialUpdate: boolean;

  public isPartialUpdate(value: boolean): this {
    this._isPartialUpdate = value;
    return this;
  }

  public build(): PutOptions {
    return this.assignBase({ isPartialUpdate: this._isPartialUpdate });
  }
}
