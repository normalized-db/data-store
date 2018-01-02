import { SetOptions } from '../set-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class SetOptionsBuilder extends BaseOptionsBuilder<SetOptions> {

  public build(): SetOptions {
    return this.buildBase();
  }
}
