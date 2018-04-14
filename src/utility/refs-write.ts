import { NdbDocument, ReverseReferences, ValidKey } from '@normalized-db/core';
import { Parent } from '../model/parent';

export class RefsWriteUtility {

  public static add(item: NdbDocument, parent: Parent | Parent[]): void {
    const refs: ReverseReferences = item._refs || {};
    if (Array.isArray(parent)) {
      parent.forEach(p => this.addKey(refs, p.type, p.key));
    } else {
      this.addKey(refs, parent.type, parent.key);
    }

    if (!item._refs) {
      Object.assign(item, { _refs: refs });
    }
  }

  private static addKey(refs: ReverseReferences, type: string, key: ValidKey): void {
    if (type in refs) {
      refs[type].add(key);
    } else {
      refs[type] = new Set<ValidKey>([key]);
    }
  }
}
