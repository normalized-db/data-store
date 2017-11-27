import { IdbContext } from '../../context/idb-context';
import { CommandFactory } from '../command-factory';
import { CreateCommand } from '../create-command';
import { RemoveCommand } from '../remove-command';
import { UpdateCommand } from '../update-command';
import { IdbCreateCommand } from './idb-create-command';
import { IdbRemoveCommand } from './idb-remove-command';
import { IdbUpdateCommand } from './idb-update-command';

export class IdbCommandFactory implements CommandFactory {

  private static _instance: IdbCommandFactory;

  public static instance(context: IdbContext): IdbCommandFactory {
    if (!this._instance) {
      this._instance = new IdbCommandFactory(context);
    }

    return this._instance;
  }

  private constructor(private readonly _context: IdbContext) {
  }

  public createCommand<Item>(type: string): CreateCommand<Item> {
    return new IdbCreateCommand(this._context, type);
  }

  public updateCommand<Item>(type: string): UpdateCommand<Item> {
    return new IdbUpdateCommand(this._context, type);
  }

  public removeCommand<Item>(type: string): RemoveCommand<Item> {
    return new IdbRemoveCommand(this._context, type);
  }
}
