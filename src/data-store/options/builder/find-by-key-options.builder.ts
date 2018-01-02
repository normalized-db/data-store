import { FindByKeyOptions } from '../find-by-key-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class FindByKeyOptionsBuilder extends BaseOptionsBuilder<FindByKeyOptions> {

  public build(): FindByKeyOptions {
    return this.buildBase();
  }
}
