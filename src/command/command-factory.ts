import { NdbDocument } from '@normalized-db/core';
import { ClearCommand } from './clear-command';
import { CreateCommand } from './create-command';
import { PutCommand } from './put-command';
import { RemoveCommand } from './remove-command';
import { SetCommand } from './set-command';
import { UpdateCommand } from './update-command';

export interface CommandFactory {
  createCommand<Item extends NdbDocument>(type: string): CreateCommand<Item>;

  updateCommand<Item extends NdbDocument>(type: string): UpdateCommand<Item>;

  setCommand<Data extends object>(type: string): SetCommand<Data>;

  putCommand<Item extends NdbDocument>(type: string): PutCommand<Item>;

  removeCommand<Item extends NdbDocument>(type: string): RemoveCommand<Item>;

  clearCommand(includeLogs: boolean): ClearCommand;
}
