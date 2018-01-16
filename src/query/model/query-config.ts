import { Depth, ValidKey } from '@normalized-db/core';
import { NdbDocument } from '@normalized-db/core/lib/src/model/ndb-document';
import { Parent } from '../../model/parent';
import { Filter } from './filter';
import { OrderBy } from './order-by';

export class QueryConfig {

  public static readonly DEFAULT_OFFSET = 0;
  public static readonly DEFAULT_LIMIT = Infinity;

  // #region General

  public type: string;
  public parent?: Parent;
  public depth?: number | Depth;

  // #endregion

  // #region single item

  public singleItem?: ValidKey;

  // #endregion

  // #region list

  public offset? = QueryConfig.DEFAULT_OFFSET;
  public limit? = QueryConfig.DEFAULT_LIMIT;
  public keys?: ValidKey[];
  public filter?: Filter<NdbDocument>;
  public orderBy?: OrderBy;

  // #endregion
}
