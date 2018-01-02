import { RemoveOptions } from '../remove-options';
import { BaseOptionsBuilder } from './base-options.builder';

export class RemoveOptionsBuilder extends BaseOptionsBuilder<RemoveOptions> {

  public build(): RemoveOptions {
    return this.buildBase();
  }
}
