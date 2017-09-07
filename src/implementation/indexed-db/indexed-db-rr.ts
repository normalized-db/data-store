import { IStoreTargetItem, Parent, ValidKey } from '@normalized-db/core';
import { DenormalizerBuilder } from '@normalized-db/denormalizer';
import { NormalizerBuilder } from '@normalized-db/normalizer';
import { Cursor, ObjectStore } from 'idb';
import { IndexedDb } from './indexed-db';

export class IndexedDbRr extends IndexedDb {

  public async addNested<Key extends ValidKey, T>(key: Key, type: string, nestedItem: T, field: string): Promise<void> {
    if ('_refs' in nestedItem) {
      if (type in nestedItem['_refs']) {
        nestedItem['_refs'][type].add(key);
      } else {
        nestedItem['_refs'][type] = new Set([key]);
      }
    } else {
      nestedItem['_refs'] = { [type]: new Set([key]) };
    }

    return super.addNested<Key, T>(key, type, nestedItem, field);
  }

  public async removeNested<Key extends ValidKey, T>(key: Key,
                                                     type: string,
                                                     nestedItem: T,
                                                     field: string): Promise<boolean> {
    if ('_refs' in nestedItem && type in nestedItem['_refs']) {
      nestedItem['_refs'][type].delete(key);
    }

    return super.removeNested(key, type, nestedItem, field);
  }

  protected buildNormalizer(): NormalizerBuilder {
    return super.buildNormalizer()
      .withReverseReferences(true);
  }

  protected buildDenormalizer(): DenormalizerBuilder {
    return super.buildDenormalizer()
      .withReverseRefsDeleted(true);
  }

  protected async persist(objectStore: ObjectStore, data: any[], type: string): Promise<void> {
    const count = data.length;
    if (count <= 0) {
      return;
    }

    if (await objectStore.count() === 0) {
      // no _refs to merge -> normal persisting for all items
      await super.persist(objectStore, data, type);
      return;
    }

    const config = this.schema.getConfig(type);
    await Promise.all(data.map(async item => await this.persistItem(objectStore, item, item[config.key])));
  }

  protected async persistItem(objectStore: ObjectStore, item: any, key: ValidKey, cursor?: Cursor): Promise<void> {
    if (!cursor) {
      cursor = await objectStore.openCursor(key);
    }

    if (cursor) {
      // merge reverse references
      const oldItem = cursor.value;
      if ('_refs' in item && '_refs' in oldItem) {
        const mergedRefs = oldItem._refs;
        Object.keys(item._refs).forEach(type => {
          if (type in mergedRefs) {
            const typeRefs = mergedRefs[type];
            item._refs[type].forEach(ref => typeRefs.add(ref));
          } else {
            mergedRefs[type] = item._refs[type];
          }
        });

        item._refs = mergedRefs;
      } else if ('_refs' in oldItem) {
        item._refs = oldItem._refs;
      }

      await cursor.update(item);
    } else {
      await objectStore.add(item);
    }
  }

  protected async persistRemoveNested(key: ValidKey, type: string, parent: Parent): Promise<void> {
    const cursor = await this.write(type).objectStore(type).openCursor(key, 'nextunique');
    if (cursor && '_refs' in cursor.value && parent.type in cursor.value._refs) {
      cursor.value._refs[parent.type].delete(parent.key);
      await cursor.update(cursor.value);
    }
  }

  protected async removeTarget(parent: Parent,
                               targetKeys: ValidKey | ValidKey[],
                               target: IStoreTargetItem): Promise<void> {
    if (target.cascadeRemoval === true) {
      await this.remove(targetKeys, target.type);
    } else {
      const keys = Array.isArray(targetKeys) ? targetKeys : [targetKeys];

      const config = this.schema.getConfig(target.type);
      const transaction = this.write(target.type);
      const objectStore = transaction.objectStore(target.type);

      await Promise.all(keys.map(async key => {
        const cursor = await objectStore.openCursor(key);
        if (cursor) {
          const targetItem = cursor.value;
          if (key === targetItem[config.key]) {
            const typeRefs = targetItem._refs[parent.type];
            typeRefs.delete(parent.key);

            if (typeRefs.size === 0) {
              delete targetItem._refs[parent.type];

              if (Object.keys(targetItem._refs).length === 0) {
                delete targetItem._refs;
              }
            }

            await cursor.update(targetItem);
          }
        }
      }));

      await transaction.complete;
    }
  }
}
