/**
 * @author Fabrizio Giordano (Fab77)
 */
export declare class TapMetadata {
    private _name;
    private _description;
    private _unit;
    private _dataType;
    private _ucd;
    private _uType;
    private _index?;
    /**
     *
     * @param name - column name
     * @param description - column description
     * @param unit - physical unit
     * @param datatype - ADQL datatype
     * @param ucd - Unified Content Descriptor
     * @param utype - ObsCore / STC-S type
     */
    constructor(name: string, description: string, unit: string, datatype: string, ucd: string, utype: string);
    get name(): string;
    get description(): string;
    get unit(): string;
    get datatype(): string;
    get ucd(): string;
    get uType(): string;
    get index(): number | undefined;
    set index(idx: number | undefined);
}
//# sourceMappingURL=TapMetadata.d.ts.map