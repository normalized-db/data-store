import { Parent } from '../../model/parent';
import { BaseOptions } from './base-options';

export interface CreateOptions extends BaseOptions {
  readonly parent?: Parent | Parent[];
}
