import { isNull, NdbDocument } from '@normalized-db/core';
import { OrderByInvalidTypeError } from '../../error/order-by-invalid-type-error';
import { OrderByTypeMismatchError } from '../../error/order-by-type-mismatch-error';
import { ORDER_ASC } from './order';
import { OrderBy } from './order-by';
import { Orderable } from './orderable';

export class Sorter<Item extends NdbDocument> {

  constructor(private readonly orderBy: OrderBy) {
    this.compare = this.compare.bind(this);
  }

  public compare(item1: Item, item2: Item): number {
    const fields = Object.keys(this.orderBy);
    const fieldCount = fields.length;
    let i = -1, result = 0;
    while (++i < fieldCount && result === 0) {
      result = this.compareFields(fields[i], item1, item2);
    }

    return result;
  }

  private compareFields(field: string, item1: Item, item2: Item): number {
    const fieldParts = field.split('.');
    const depth = fieldParts.length - 1;
    let value1: Orderable, value2: Orderable;
    if (depth <= 0) {
      value1 = item1[field];
      value2 = item2[field];
    } else {
      value1 = this.getNestedValue(fieldParts, depth, item1);
      value2 = this.getNestedValue(fieldParts, depth, item2);
    }

    const isNull1 = isNull(value1);
    const isNull2 = isNull(value2);
    let result: number;
    if (isNull1 && isNull2) {
      result = 0;
    } else if (!isNull1 && isNull2) {
      result = 1;
    } else if (isNull1 && !isNull2) {
      result = -1;
    } else {
      result = this.compareValues(field, value1, value2);
    }

    return this.orderBy[field] === ORDER_ASC ? result : -result;
  }

  private getNestedValue(fieldParts: string[], depth: number, item: object): Orderable | undefined {
    let currentDocument = item;
    let i = 0;
    do {
      const fieldPart = fieldParts[i];
      const currentType = typeof currentDocument;
      if (currentType !== 'undefined' && currentType !== 'object') {
        throw new OrderByInvalidTypeError(fieldPart, currentType);
      }
      currentDocument = currentDocument[fieldPart];
    } while (++i < depth && currentDocument);

    return currentDocument ? currentDocument[fieldParts[i]] : undefined;
  }

  private compareValues(field: string, value1: any, value2: any): number {
    let result = 0;
    const type1 = typeof value1, type2 = typeof value2;
    if (type1 !== type2) {
      throw new OrderByTypeMismatchError(field, type1, type2);
    }

    switch (type1) {
      case 'string':
        result = value1.localeCompare(value2);
        break;

      case 'number':
        result = value1 - value2;
        break;

      case 'boolean':
        if (value1 === value2) {
          result = 0;
        } else {
          const b1 = value1 ? 2 : 0;
          const b2 = value2 ? 1 : 0;
          result = b1 - b2;
        }
        break;

      case 'object':
        if (value1 instanceof Date && value2 instanceof Date) {
          result = value1.getTime() - value2.getTime();
        } else if (Array.isArray(value1) && Array.isArray(value2)) {
          result = value1.length - value2.length;
        } else {
          throw new OrderByInvalidTypeError(field, type1);
        }
        break;

      default:
        throw new OrderByInvalidTypeError(field, type1);
    }

    return result;
  }
}
