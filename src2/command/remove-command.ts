import { ValidKey } from '@normalized-db/core';
import { Command } from './command';

export interface RemoveCommand<T> extends Command<T | ValidKey> {

  /**
   * Remove the item from its data-store. Entities which reference the removed item will be updated as well.
   * If any `cascadeRemoval`-children are configured for this item, these will be removed as well.
   *
   * @param {T|ValidKey} data
   * @returns {Promise<boolean>}
   */
  execute(data: T | ValidKey): Promise<boolean>;
}
