import { isNull, ValidKey } from '@normalized-db/core';
import { Cursor, Transaction } from 'idb';
import { NotFoundError } from '../../error/not-found-error';
import { Parent } from '../../query/model/parent';
import { BaseCommand } from '../base-command';
import { CreateCommand } from '../create-command';
import { PutCommand } from '../put-command';
import { UpdateCommand } from '../update-command';

export abstract class IdbBaseWriteCommand<T> extends BaseCommand<T | T[]> implements CreateCommand<T>,
                                                                                     UpdateCommand<T>,
                                                                                     PutCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {Parent} parent
   * @returns {Promise<boolean>}
   */
  public async execute(data: T | T[], parent?: Parent): Promise<boolean> {
    const normalizedData = this._context.normalizer().apply(data, this._type);
    const involvedTypes = this.getTypes(normalizedData);
    if (parent) {
      involvedTypes.push(parent.type);
    }

    const transaction = this._context.write(involvedTypes);
    try {
      const requests = involvedTypes.map(async type => {
        const config = this.schema.getConfig(type);
        const objectStore = transaction.objectStore(type);
        await Promise.all(normalizedData[type].map(async item => {
          const cursor = await objectStore.get(this.getKey(item, config));
          return await (cursor ? this.updateCursor(cursor, item) : objectStore.put(item));
        }));
      });

      if (parent) {
        requests.push(this.addToParent(transaction, parent, data));
      }

      await Promise.all(requests);
    } catch (e) {
      transaction.abort();
      console.error(e);
      return false;
    }

    return true;
  }

  /**
   * Merge each field of `newItem` into the cursor's current value so an update is possible field by field and not only
   * entire objects. Furthermore the `_refs`-field created during normalization must be merged.
   *
   * @param {Cursor} cursor
   * @param newItem
   * @returns {Promise<void>}
   */
  private async updateCursor(cursor: Cursor, newItem: any): Promise<void> {
    const mergedItem = cursor.value;
    Object.keys(newItem)
      .filter(field => field !== '_refs')
      .forEach(field => {
        mergedItem[field] = newItem[field];
      });

    const mergedRefs: { [type: string]: Set<ValidKey> } = cursor.value._refs || {};
    if ('_refs' in newItem) {
      Object.keys(newItem._refs)
        .forEach(refType => {
          if (refType in mergedRefs) {
            const it: Iterator<any> = newItem._refs[refType].values();
            let current = it.next();
            while (!current.done) {
              mergedRefs[refType].add(current.value);
              current = it.next();
            }
          } else {
            mergedRefs[refType] = newItem._refs[refType];
          }
        });
    }

    mergedItem._refs = mergedRefs;
    return await cursor.update(mergedItem);
  }

  private async addToParent(transaction: Transaction, parent: Parent, data: T | T[]): Promise<void> {
    const parentItem = await transaction.objectStore(parent.type).get(parent.key);
    if (isNull(parentItem)) {
      throw new NotFoundError(parent.type, parent.key);
    }

    const parentTargets = this.schema.getConfig(parent.type).targets;
    if (!parentTargets || !(parent.field in parentTargets) || parentTargets.field.type !== this._type) {
      throw new Error(`${parent.type}.${parent.field} is not configured as target for ${this._type}`);
    }

    return await this.addKeysToParentsHelper(
      transaction,
      parent,
      parentItem,
      Array.isArray(data) ? data.map(item => this.getKey(item)) : [this.getKey(data)]
    );
  }

  private async addKeysToParentsHelper(transaction: Transaction,
                                       parent: Parent,
                                       parentItem: any,
                                       keys: ValidKey[]): Promise<void> {
    let parentChanged = false;
    const fieldValue = parentItem[parent.field];
    if (Array.isArray(fieldValue)) {
      if (isNull(fieldValue)) {
        keys.forEach(itemKey => {
          const index = fieldValue.findIndex(key => key === itemKey);
          if (index < 0) {
            parentItem[parent.field].add(itemKey);
            parentChanged = true;
          }
        });
      } else {
        parentItem[parent.field] = keys;
        parentChanged = true;
      }
    } else {
      if (keys.length > 1) {
        throw new Error('Cannot add multiple children to a non-array parent field');
      }

      const newChildKey = keys.shift();
      if (fieldValue !== newChildKey) {
        if (!isNull(fieldValue)) {
          const oldChildCursor = await transaction.objectStore(this._type).openCursor(fieldValue);
          if (oldChildCursor) {
            const oldChild = oldChildCursor.value;
            if ('_refs' in oldChild && parent.type in oldChild._refs) {
              oldChild._refs[parent.type].delete(parent.key);
              await oldChildCursor.update(oldChild);
            }
          }
        }

        parentItem[parent.field] = newChildKey;
        parentChanged = true;
      }
    }

    if (parentChanged) {
      await transaction.objectStore(parent.type).put(parentItem);
    }
  }
}
