import { FindOptions } from '../find-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class FindOptionsBuilder extends BaseOptionsBuilder<FindOptions> {

  public build(): FindOptions {
    return this.buildBase();
  }
}
