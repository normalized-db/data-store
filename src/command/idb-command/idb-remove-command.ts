import { isNull, IStore, IStoreTarget, NdbDocument, NotFoundError, ValidKey } from '@normalized-db/core';
import { ObjectStore, Transaction } from 'idb';
import { IdbContext } from '../../context/idb-context/idb-context';
import { EmptyInputError } from '../../error/empty-input-error';
import { RemovedEvent } from '../../event/removed-event';
import { Parent } from '../../model/parent';
import { isValidKey } from '../../utility/valid-key';
import { RemoveCommand } from '../remove-command';
import { IdbBaseCommand } from './idb-base-command';

export class IdbRemoveCommand<T extends NdbDocument> extends IdbBaseCommand<T | ValidKey> implements RemoveCommand<T> {

  constructor(context: IdbContext<any>, type: string) {
    super(context, type);
  }

  /**
   * @inheritDoc
   *
   * @param {T|ValidKey} data
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  public async execute(data: T | ValidKey): Promise<boolean> {
    if (isNull(data)) {
      throw new EmptyInputError('remove');
    }

    const key = isValidKey(data) ? data as ValidKey : this.getKey(data as NdbDocument);
    const transaction = await this._context.write();
    const oldItem = await transaction.objectStore(this._type).get(key);
    if (isNull(oldItem)) {
      throw new NotFoundError(this._type, key);
    }

    try {
      await this.executeRecursive(this._type, oldItem, transaction, transaction.objectStore(this._type));
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

  private async executeRecursive(type: string,
                                 item: NdbDocument,
                                 transaction: Transaction,
                                 objectStore: ObjectStore): Promise<void> {
    const config = this.schema.getConfig(type);
    const key = this.getKey(item, config);
    await Promise.all([
      this.cascadeRemoval(transaction, config.targets, type, item),
      this.updateParents(transaction, type, item),
      objectStore.delete(key)
    ]);

    this._eventQueue.enqueue(new RemovedEvent(type, item, key));
  }

  // region remove dependent child entities

  private async cascadeRemoval(transaction: Transaction,
                               targets: IStoreTarget,
                               type: string,
                               oldItem: any): Promise<void> {
    if (!targets) {
      return;
    }

    const oldItemKey = this.getKey(oldItem, this.schema.getConfig(type));
    await Promise.all(Object.keys(targets).map(async field => {
      const target = targets[field];
      if (target.cascadeRemoval && field in oldItem && !isNull(oldItem[field])) {
        await this.removeTarget(transaction, type, oldItemKey, target.type, oldItem[field]);
      }
    }));
  }

  private async removeTarget(transaction: Transaction,
                             parentType: string,
                             parentKey: ValidKey,
                             targetType: string,
                             targetKeys: ValidKey | ValidKey[]): Promise<void> {
    const objectStore = transaction.objectStore(targetType);
    const remover = async targetKey => {
      const target = await objectStore.get(targetKey);
      if (!isNull(target)) {
        if ('_refs' in target && parentType in target._refs) {
          // prevent update of parent which is deleted anyway
          target._refs[parentType].delete(parentKey);
        }
        await this.executeRecursive(targetType, target, transaction, objectStore);
      }
    };

    if (Array.isArray(targetKeys)) {
      await Promise.all(targetKeys.map(remover));
    } else {
      await remover(targetKeys);
    }
  }

  // endregion

  // region update parents

  private async updateParents(transaction: Transaction, oldItemType: string, oldItem: NdbDocument): Promise<void> {
    if ('_refs' in oldItem) {
      const oldItemKey = this.getKey(oldItem, this.schema.getConfig(oldItemType));
      await Promise.all(Object.keys(oldItem['_refs']).map(async refType => {
        const parentConfig = this.schema.getConfig(refType);
        const parentFields = this.getParentFields(oldItemType, parentConfig);

        const requests: Promise<void>[] = [];
        const objectStore = transaction.objectStore(refType);

        const it: Iterator<any> = oldItem._refs[refType].values();
        let current = it.next();
        while (!current.done) {
          requests.push(this.removeFromParent(
            oldItemType,
            oldItem,
            oldItemKey,
            objectStore,
            current.value,
            parentFields
          ));
          current = it.next();
        }

        return Promise.all(requests);
      }));
    }
  }

  private getParentFields(oldItemType: string, parentConfig: IStore): string[] {
    const parentFields: string[] = [];
    Object.keys(parentConfig.targets).forEach(field => {
      if (parentConfig.targets[field].type === oldItemType) {
        parentFields.push(field);
      }
    });

    return parentFields;
  }

  private async removeFromParent(oldItemType: string,
                                 oldItem: NdbDocument,
                                 oldItemKey: ValidKey,
                                 parentObjectStore: ObjectStore,
                                 parentKey: ValidKey,
                                 fields: string[]): Promise<void> {
    const parentCursor = await parentObjectStore.openCursor(parentKey);
    if (!isNull(parentCursor)) {
      const enqueueRemovedEvent = (field: string) => this._eventQueue.enqueue(new RemovedEvent(
        oldItemType,
        oldItem,
        oldItemKey,
        new Parent(parentObjectStore.name, parentKey, field)
      ));

      let parentChanged = false;
      const parent = parentCursor.value;
      fields.forEach(async field => {
        if (!(field in parent) || isNull(parent[field])) {
          return;
        }

        const fieldValue = parent[field];
        if (Array.isArray(fieldValue)) {
          const index = fieldValue.findIndex(key => key === oldItemKey);
          if (index >= 0) {
            fieldValue.splice(index, 1);
            parentChanged = true;
            enqueueRemovedEvent(field);
          }
        } else if (fieldValue === oldItemKey) {
          parent[field] = null;
          parentChanged = true;
          enqueueRemovedEvent(field);
        }
      });

      if (parentChanged) {
        await parentCursor.update(parent);
      }
    }
  }

  // endregion
}
