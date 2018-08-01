import { isNull, NdbDocument, NotFoundError, TypeMismatchError, ValidKey } from '@normalized-db/core';
import { Cursor, ObjectStore, Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { CreatedEvent } from '../../event/created-event';
import { UpdatedEvent } from '../../event/updated-event';
import { Parent } from '../../model/parent';
import { RefsWriteUtility } from '../../utility/refs-write';
import { IdbBaseCommand } from './idb-base-command';

export abstract class IdbBaseWriteCommand<T extends NdbDocument> extends IdbBaseCommand<T | T[]> {

  constructor(context: IdbContext<any>, type: string) {
    super(context, type);
  }

  /**
   * @inheritDoc
   *
   * @param {T|T[]} data
   * @param {Parent|Parent[]} parent
   * @param {boolean} isPartialUpdate
   * @returns {Promise<boolean>}
   */
  public async write(data: T | T[], parent?: Parent | Parent[], isPartialUpdate?: boolean): Promise<boolean> {
    const normalizedData = await this._context.normalizer().apply(this._type, data);
    const involvedTypes = [...this.getTypes(normalizedData), ...this.getTypes(normalizedData)];
    if (parent) {
      if (Array.isArray(parent)) {
        parent.forEach(p => involvedTypes.push(p.type));
      } else {
        involvedTypes.push(parent.type);
      }
    }

    const transaction = await this._context.write(involvedTypes);
    try {
      const newItemKeys: ValidKey[] = [];
      await Promise.all(Object.keys(normalizedData).map(async type => {
        const config = this.schema.getConfig(type);
        const objectStore = transaction.objectStore(type);
        await Promise.all(normalizedData[type].map(async item => {
          if (parent) {
            RefsWriteUtility.add(item, parent);
          }

          let key = this.getKey(item, config, true);
          if (isNull(key)) {
            await objectStore.put(item);
            item[config.key] = key = await this.getLatestKey(objectStore);
            this._eventQueue.enqueue(new CreatedEvent(type, item, key, type === this._type ? parent : null));
          } else {
            const cursor = await objectStore.openCursor(key);
            if (cursor && cursor.value) {
              const mergedItem = await this.updateCursor(cursor, item, isPartialUpdate);
              this._eventQueue.enqueue(new UpdatedEvent(type, mergedItem, key));
            } else {
              await objectStore.put(item);
              this._eventQueue.enqueue(new CreatedEvent(type, item, key, type === this._type ? parent : null));
            }
          }

          if (type === this._type) {
            newItemKeys.push(key);
          }
        }));
      }));

      if (parent) {
        await this.addToParents(transaction, parent, newItemKeys);
      }
    } catch (e) {
      console.error(e);
      try {
        transaction.abort();
      } catch (e2) {
        console.error(e2);
      }
      return false;
    }

    this.onSuccess();
    return true;
  }

  /**
   * Merge each field of `newItem` into the cursor's current value so an update is possible field by field and not only
   * entire objects. Furthermore the `_refs`-field created during normalization must be merged.
   *
   * @param {Cursor} cursor
   * @param {NdbDocument} newItem
   * @param {boolean} isPartialUpdate
   * @returns {Promise<object>}
   */
  private async updateCursor(cursor: Cursor, newItem: NdbDocument, isPartialUpdate: boolean): Promise<object> {
    let mergedItem: NdbDocument;
    if (isPartialUpdate) {
      mergedItem = cursor.value;
      Object.keys(newItem)
          .filter(field => field !== '_refs')
          .forEach(field => mergedItem[field] = newItem[field]);
    } else {
      mergedItem = newItem;
    }

    if ((cursor.value._refs && Object.keys(cursor.value._refs).length > 0) ||
        (newItem._refs && Object.keys(newItem._refs).length > 0)) {
      const mergedRefs: { [type: string]: Set<ValidKey> } = cursor.value._refs || {};
      if (newItem._refs) {
        Object.keys(newItem._refs)
            .forEach(refType => {
              if (refType in mergedRefs) {
                const it: Iterator<ValidKey> = newItem._refs[refType].values();
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

      Object.assign(mergedItem, { _refs: mergedRefs });
    }

    await cursor.update(mergedItem);
    return mergedItem;
  }

  private async addToParents(transaction: Transaction, parent: Parent | Parent[], keys: ValidKey[]): Promise<void> {
    if (keys && keys.length === 0) {
      return;
    }

    if (Array.isArray(parent)) {
      await Promise.all(parent.map(p => this.addToParent(transaction, p, keys)));
    } else {
      await this.addToParent(transaction, parent, keys);
    }
  }

  private async addToParent(transaction: Transaction, parent: Parent, keys: ValidKey[]): Promise<void> {
    const parentItem = await transaction.objectStore(parent.type).get(parent.key);
    if (isNull(parentItem)) {
      throw new NotFoundError(parent.type, parent.key);
    }

    const parentTargets = this.schema.getConfig(parent.type).targets;
    if (!parentTargets || !(parent.field in parentTargets) || parentTargets[parent.field].type !== this._type) {
      throw new Error(`${parent.type}.${parent.field} is not configured as target for ${this._type}`);
    }

    return await this.addKeysToParentsHelper(
        transaction,
        parent,
        parentItem,
        keys
    );
  }

  private async addKeysToParentsHelper(transaction: Transaction,
                                       parent: Parent,
                                       parentItem: NdbDocument,
                                       keys: ValidKey[]): Promise<void> {
    let parentChanged = false;
    const fieldValue = parentItem[parent.field];
    const isArrayExpected = this.schema.getConfig(parent.type).targets[parent.field].isArray;
    if (isArrayExpected) {
      if (isNull(fieldValue)) {
        parentItem[parent.field] = keys;
        parentChanged = true;
      } else if (Array.isArray(fieldValue)) {
        keys.forEach(itemKey => {
          const index = fieldValue.findIndex(key => key === itemKey);
          if (index < 0) {
            fieldValue.push(itemKey);
            parentChanged = true;
          }
        });
      } else {
        throw new TypeMismatchError(parent.type, parent.field, true);
      }
    } else {
      if (keys.length > 1) {
        throw new Error('Cannot add multiple children to a non-array parent field');
      }

      const newChildKey = keys.shift();
      if (fieldValue !== newChildKey) {
        if (!isNull(fieldValue)) {
          if (Array.isArray(fieldValue)) {
            throw new TypeMismatchError(parent.type, parent.field, false);
          }

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

  private async getLatestKey(objectStore: ObjectStore): Promise<ValidKey | null> {
    const cursor = await objectStore.openCursor(null, 'prevunique');
    return cursor ? cursor.key as ValidKey : null;
  }
}
