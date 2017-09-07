import { IStoreTargetItem, Parent, ValidKey } from '@normalized-db/core';
import { DenormalizerBuilder } from '@normalized-db/denormalizer';
import { NormalizerBuilder } from '@normalized-db/normalizer';
import { InMemoryDb } from './in-memory-db';

export class InMemoryDbRr extends InMemoryDb {

  protected buildNormalizer(): NormalizerBuilder {
    return super.buildNormalizer()
      .withReverseReferences(true);
  }

  protected buildDenormalizer(): DenormalizerBuilder {
    return super.buildDenormalizer()
      .withReverseRefsDeleted(true);
  }

  protected overrideItem(typeResult: any[], index: number, item: any) {
    const oldItem = typeResult[index];

    // merge reverse references
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

    super.overrideItem(typeResult, index, item);
  }

  protected async removeTarget(parent: Parent, keys: ValidKey | ValidKey[], target: IStoreTargetItem): Promise<void> {
    if (target.cascadeRemoval === true) {
      await this.remove(keys, target.type);
    } else {
      if (!Array.isArray(keys)) {
        keys = [keys];
      }

      const typeKeys = this.keys[target.type];
      keys.forEach(key => {
        if (typeKeys.has(key)) {
          const targetItem = this.data[target.type][typeKeys.get(key)];
          if (!('_refs' in targetItem)) {
            return;
          }

          const typeRefs = targetItem._refs[parent.type];
          typeRefs.delete(parent.key);

          if (typeRefs.size === 0) {
            delete targetItem._refs[parent.type];

            if (Object.keys(targetItem._refs).length === 0) {
              delete targetItem._refs;
            }
          }
        }
      });
    }
  }
}
