import { NdbDocument } from '@normalized-db/core';
import { IdbContext } from '../../context/idb-context/idb-context';
import { ClearCommand } from '../clear-command';
import { CommandFactory } from '../command-factory';
import { CreateCommand } from '../create-command';
import { PutCommand } from '../put-command';
import { RemoveCommand } from '../remove-command';
import { UpdateCommand } from '../update-command';
import { IdbClearCommand } from './idb-clear-command';
import { IdbCreateCommand } from './idb-create-command';
import { IdbPutCommand } from './idb-put-command';
import { IdbRemoveCommand } from './idb-remove-command';
import { IdbUpdateCommand } from './idb-update-command';

export class IdbCommandFactory implements CommandFactory {

  private static _instance: IdbCommandFactory;

  public static instance(context: IdbContext<any>): IdbCommandFactory {
    if (!this._instance) {
      this._instance = new IdbCommandFactory(context);
    }

    return this._instance;
  }

  private constructor(private readonly _context: IdbContext<any>) {
  }

  public createCommand<Item extends NdbDocument>(type: string): CreateCommand<Item> {
    return new IdbCreateCommand(this._context, type);
  }

  public updateCommand<Item extends NdbDocument>(type: string): UpdateCommand<Item> {
    return new IdbUpdateCommand(this._context, type);
  }

  public putCommand<Item extends NdbDocument>(type: string): PutCommand<Item> {
    return new IdbPutCommand(this._context, type);
  }

  public removeCommand<Item extends NdbDocument>(type: string): RemoveCommand<Item> {
    return new IdbRemoveCommand(this._context, type);
  }

  public clearCommand(includeLogs?: boolean): ClearCommand {
    return new IdbClearCommand(this._context, includeLogs);
  }
}
