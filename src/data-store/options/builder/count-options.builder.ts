import { CountOptions } from '../count-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class CountOptionsBuilder extends BaseOptionsBuilder<CountOptions> {

  public build(): CountOptions {
    return this.buildBase();
  }
}
