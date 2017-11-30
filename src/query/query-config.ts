import { Depth, ValidKey } from '@normalized-db/core';
import { Parent } from '../model/parent';
import { Filter } from './model/filter';

export class QueryConfig {

  public static readonly DEFAULT_OFFSET = 0;
  public static readonly DEFAULT_LIMIT = Infinity;

  public type: string;

  public countOnly?: boolean;
  public singleItem?: ValidKey;

  public offset? = QueryConfig.DEFAULT_OFFSET;
  public limit? = QueryConfig.DEFAULT_LIMIT;
  public filter?: Filter<any>;
  public parent?: Parent;

  public depth?: number | Depth;
}
