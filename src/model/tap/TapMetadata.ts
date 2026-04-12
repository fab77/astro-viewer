'use strict'
/**
 * @author Fabrizio Giordano (Fab77)
 */

export class TapMetadata {
  private _name: string
  private _description: string
  private _unit: string
  private _dataType: string
  private _ucd: string
  private _uType: string
  private _index?: number

  /**
   *
   * @param name - column name
   * @param description - column description
   * @param unit - physical unit
   * @param datatype - ADQL datatype
   * @param ucd - Unified Content Descriptor
   * @param utype - ObsCore / STC-S type
   */
  constructor(
    name: string,
    description: string,
    unit: string,
    datatype: string,
    ucd: string,
    utype: string
  ) {
    this._name = name
    this._description = description
    this._unit = unit
    this._dataType = datatype
    this._ucd = ucd
    this._uType = utype
  }

  get name(): string {
    return this._name
  }

  get description(): string {
    return this._description
  }

  get unit(): string {
    return this._unit
  }

  get datatype(): string {
    return this._dataType
  }

  get ucd(): string {
    return this._ucd
  }

  get uType(): string {
    return this._uType
  }

  get index(): number | undefined {
    return this._index
  }

  set index(idx: number | undefined) {
    this._index = idx
  }
}

// export default TapMetadata