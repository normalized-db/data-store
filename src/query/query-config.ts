import { Depth, ValidKey } from '@normalized-db/core';
import { NdbDocument } from '@normalized-db/core/lib/src/model/ndb-document';
import { Parent } from '../model/parent';
import { Filter } from './model/filter';

export class QueryConfig {

  public static readonly DEFAULT_OFFSET = 0;
  public static readonly DEFAULT_LIMIT = Infinity;

  public type: string;

  public singleItem?: ValidKey;

  public offset? = QueryConfig.DEFAULT_OFFSET;
  public limit? = QueryConfig.DEFAULT_LIMIT;
  public keys?: ValidKey[];
  public filter?: Filter<NdbDocument>;
  public parent?: Parent;

  public depth?: number | Depth;
}
