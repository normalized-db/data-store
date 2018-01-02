import { Parent } from '../../../model/parent';
import { CreateOptions } from '../create-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class CreateOptionsBuilder extends BaseOptionsBuilder<CreateOptions> {

  private _parent: Parent;

  public parent(value: Parent): this {
    this._parent = value;
    return this;
  }

  public build(): CreateOptions {
    return this.assignBase({ parent: this._parent });
  }
}
