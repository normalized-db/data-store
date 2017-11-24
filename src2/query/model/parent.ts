import { ValidKey } from '@normalized-db/core';

export class Parent {

  /**
   * @param {string} type Name of the parent's data-store
   * @param {ValidKey} key Unique key of the parent-object
   * @param {string} field The field on the parent-object which should be searched for the child-object
   */
  constructor(public readonly type: string,
              public readonly key: ValidKey,
              public readonly field: string) {
  }
}
