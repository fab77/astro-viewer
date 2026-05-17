/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
 */

'use strict'
/**
 * @author Fabrizio Giordano (Fab77)
 */

export type DetailValue = string | number;

export enum ColumnType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  GEOM_RA = "GEOM_RA",
  GEOM_DEC = "GEOM_DEC",
  GEOM_FOOTPRINT = "GEOM_FOOTPRINT",
  MAIN_NAME = "MAIN_NAME"
}

export interface MetadataInit {
  index: number;
  name: string;
  columnType: ColumnType;
  description?: string; // default: ""
  unit: string
  details?: Map<string, DetailValue>;
}

export class MetadataColumn {
  
  private _index: number // mandatory

  private _name: string // mandatory
  private _description: string = "" // mandatory default ""
  private _columnType: ColumnType // mandatory
  private _unit: string // mandatory
  private _details: Map<string, string | number> = new Map()

  constructor(init: MetadataInit) {
    
    if (!init.name) throw new Error(`No name column defined.`)
    this._name = init.name

    if (init.index < 0 || isNaN(init.index)) throw new Error(`No index column defined.`)
    this._index = init.index
    
    this._columnType = init.columnType ?? ColumnType.STRING;

    this._unit = init.unit ?? ""

    this._description = init.description ?? ""
    
    if (init.details) this._details = new Map(init.details)
  }

  get details(): ReadonlyMap<string, DetailValue> {
    return new Map(this._details);
  }

  /** Get any detail; optional fallback. */
  getDetail(key: string, fallback?: DetailValue): DetailValue | undefined {
    return this._details.has(key) ? this._details.get(key) : fallback;
  }

  /** Type-leaning getters with fallbacks. */
  getString(key: string, fallback = ""): string {
    const v = this._details.get(key);
    return typeof v === "string" ? v : fallback;
  }

  getNumber(key: string, fallback = NaN): number {
    const v = this._details.get(key);
    return typeof v === "number" ? v : fallback;
  }

  /** Set or update a detail. */
  setDetail(key: string, value: DetailValue): void {
    this._details.set(key, value);
  }

  /** Add many details at once. */
  setDetails(details: Record<string, DetailValue> | Map<string, DetailValue>): void {
    const entries = details instanceof Map ? details.entries() : Object.entries(details);
    for (const [k, v] of entries) this._details.set(k, v);
  }

  /** Keys, values, entries (as arrays). */
  detailKeys(): string[] {
    return Array.from(this._details.keys());
  }

  detailValues(): DetailValue[] {
    return Array.from(this._details.values());
  }

  detailEntries(): [string, DetailValue][] {
    return Array.from(this._details.entries());
  }

  // ---------- core getters/setters ----------
  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get columnType(): string {
    return this._columnType;
  }

  get index(): number | undefined {
    return this._index;
  }

  get unit(): string {
    return this._unit
  }

  // ---------- serialisation ----------
  toJSON(): Record<string, unknown> {
    return {
      name: this._name,
      description: this._description,
      columnType: this._columnType,
      index: this._index,
      unit: this._unit,
      details: Object.fromEntries(this._details),
    };
  }


}