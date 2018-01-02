import { Parent } from '../../model/parent';
import { BaseOptions } from './base-options';

export interface PutOptions extends BaseOptions {
  readonly parent?: Parent;
  readonly isPartialUpdate?: boolean;
}
