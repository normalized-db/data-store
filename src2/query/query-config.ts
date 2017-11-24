import { Depth, ValidKey } from '@normalized-db/core';
import { Predicate } from '../model/predicate';
import { Parent } from './model/parent';

export class QueryConfig {

  public static readonly DEFAULT_OFFSET = 0;
  public static readonly DEFAULT_LIMIT = Infinity;

  public type: string;

  public singleItem?: ValidKey;

  public offset? = QueryConfig.DEFAULT_OFFSET;
  public limit? = QueryConfig.DEFAULT_LIMIT;
  public filter?: Predicate<any>;
  public parent?: Parent;

  public depth?: Depth;
}
