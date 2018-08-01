import { EventSelection, ValidKey } from '@normalized-db/core';
import { ListenerRegisteredError } from '../../error/listener-registered-error';
import { DataStoreTypes } from '../../model/data-store-types';
import { EventRegistration } from './event-registration';
import { OnDataChanged } from './on-data-changed';

export class EventRegistrationBuilder<Types extends DataStoreTypes> {

  private _eventSelection: EventSelection;
  private _dataStoreType: Types | Types[];
  private _itemKey: ValidKey | ValidKey[];

  constructor(private readonly _registrations: Map<OnDataChanged, EventRegistration<Types>>,
              private readonly _listener: OnDataChanged) {
    if (this._registrations.has(_listener)) {
      throw new ListenerRegisteredError();
    }
  }

  public eventType(value: EventSelection): this {
    this._eventSelection = value;
    return this;
  }

  public type(value: Types | Types[]): this {
    this._dataStoreType = value;
    return this;
  }

  public itemKey(value: ValidKey | ValidKey[]): this {
    this._itemKey = value;
    return this;
  }

  public build(): EventRegistration<Types> {
    const registration = new EventRegistration<Types>(
        this._listener,
        this._eventSelection,
        this._dataStoreType,
        this._itemKey
    );

    this._registrations.set(this._listener, registration);
    return registration;
  }
}
