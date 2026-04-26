/**
 * @author Fabrizio Giordano (Fab77)
 */
export type DetailValue = string | number;
export declare enum ColumnType {
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
    description?: string;
    unit: string;
    details?: Map<string, DetailValue>;
}
export declare class MetadataColumn {
    private _index;
    private _name;
    private _description;
    private _columnType;
    private _unit;
    private _details;
    constructor(init: MetadataInit);
    get details(): ReadonlyMap<string, DetailValue>;
    /** Get any detail; optional fallback. */
    getDetail(key: string, fallback?: DetailValue): DetailValue | undefined;
    /** Type-leaning getters with fallbacks. */
    getString(key: string, fallback?: string): string;
    getNumber(key: string, fallback?: number): number;
    /** Set or update a detail. */
    setDetail(key: string, value: DetailValue): void;
    /** Add many details at once. */
    setDetails(details: Record<string, DetailValue> | Map<string, DetailValue>): void;
    /** Keys, values, entries (as arrays). */
    detailKeys(): string[];
    detailValues(): DetailValue[];
    detailEntries(): [string, DetailValue][];
    get name(): string;
    get description(): string;
    get columnType(): string;
    get index(): number | undefined;
    get unit(): string;
    toJSON(): Record<string, unknown>;
}
