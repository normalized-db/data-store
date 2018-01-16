import { Parent } from '../../model/parent';
import { BaseOptions } from './base-options';

export interface PutOptions extends BaseOptions {
  readonly parent?: Parent | Parent[];
  readonly isPartialUpdate?: boolean;
}
