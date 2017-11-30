import { isNull, IStore, IStoreTarget, NotFoundError, ValidKey } from '@normalized-db/core';
import { ObjectStore, Transaction } from 'idb';
import { isValidKey } from '../../utility/valid-key';
import { BaseCommand } from '../base-command';
import { RemoveCommand } from '../remove-command';

export class IdbRemoveCommand<T> extends BaseCommand<T | ValidKey> implements RemoveCommand<T> {

  /**
   * @inheritDoc
   *
   * @param {T|ValidKey} data
   * @returns {Promise<boolean>}
   * @throws {NotFoundError}
   */
  public async execute(data: T | ValidKey): Promise<boolean> {
    const key = isValidKey(data) ? data as ValidKey : this.getKey(data);
    const oldItem = await this._context.read(this._type).objectStore(this._type).get(key);
    if (isNull(oldItem)) {
      throw new NotFoundError(this._type, key);
    }

    const transaction = this._context.write();
    try {
      await this.executeRecursive(this._type, oldItem, transaction, transaction.objectStore(this._type));
    } catch (e) {
      transaction.abort();
      return false;
    }

    return true;
  }

  private async executeRecursive(type: string,
                                 item: any,
                                 transaction: Transaction,
                                 objectStore: ObjectStore): Promise<void> {
    const config = this.schema.getConfig(type);
    await Promise.all([
      this.cascadeRemoval(transaction, config.targets, type, item),
      this.updateParents(transaction, type, item),
      objectStore.delete(this.getKey(item, config))
    ]);
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
          target._refs.parentType.delete(parentKey);
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

  private async updateParents(transaction: Transaction, oldItemType: string, oldItem: any): Promise<void> {
    if ('_refs' in oldItem) {
      const oldItemKey = this.getKey(oldItem, this.schema.getConfig(oldItemType));
      await Promise.all(Object.keys(oldItem['_refs']).map(async refType => {
        const parentConfig = this.schema.getConfig(refType);
        const parentFields = this.getParentFields(oldItemType, parentConfig);

        const requests: Promise<void>[] = [];
        const objectStore = transaction.objectStore(refType);

        const it: Iterator<any> = oldItem._refs.refType.values();
        let current = it.next();
        while (!current.done) {
          requests.push(this.removeFromParent(objectStore, parentFields, current.value, oldItemKey));
          current = it.next();
        }

        return Promise.all(requests);
      }));
    }
  }

  private getParentFields(oldItemType: string, parentConfig: IStore): string[] {
    const parentFields: string[] = [];
    Object.keys(parentConfig.targets).forEach(field => {
      const target = parentConfig.targets.key;
      if (target.type === oldItemType) {
        parentFields.push(field);
      }
    });

    return parentFields;
  }

  private async removeFromParent(objectStore: ObjectStore,
                                 fields: string[],
                                 parentKey: ValidKey,
                                 oldItemKey: ValidKey): Promise<void> {
    const parentCursor = await objectStore.openCursor(parentKey);
    if (!isNull(parentCursor)) {
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
          }
        } else if (fieldValue === oldItemKey) {
          parent[field] = null;
          parentChanged = true;
        }
      });

      if (parentChanged) {
        await parentCursor.update(parent);
      }
    }
  }

  // endregion
}
