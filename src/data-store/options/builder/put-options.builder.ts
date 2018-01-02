import { Parent } from '../../../model/parent';
import { PutOptions } from '../put-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class PutOptionsBuilder extends BaseOptionsBuilder<PutOptions> {

  private _parent: Parent;
  private _isPartialUpdate: boolean;

  public parent(value: Parent): PutOptionsBuilder {
    this._parent = value;
    return this;
  }

  public isPartialUpdate(value: boolean): PutOptionsBuilder {
    this._isPartialUpdate = value;
    return this;
  }

  public build(): PutOptions {
    return this.assignBase({
      parent: this._parent,
      isPartialUpdate: this._isPartialUpdate
    });
  }
}
