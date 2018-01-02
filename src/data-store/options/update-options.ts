import { BaseOptions } from './base-options';

export interface UpdateOptions extends BaseOptions {
  readonly isPartialUpdate?: boolean;
}
