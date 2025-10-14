import TapMetadata from "../tap/TapMetadata.js";
import TapMetadataList from "../tap/TapMetadataList.js";
export default class CatalogueProps {
    static STANDARD_SIZE: string;
    raColumn: TapMetadata;
    decColumn: TapMetadata;
    nameColumn?: TapMetadata;
    /** Optional: numeric/size-mapped column */
    shapeSizeColumn?: TapMetadata;
    /** Optional: hue/category-mapped column */
    shapeHueColumn?: TapMetadata;
    /** Base color (hex string like #RRGGBB) */
    shapeColor: string;
    /** Full metadata list reference (kept in sync by updateColumnsIndex) */
    tapMetadataList: TapMetadataList;
    constructor(tapMetadataList: TapMetadataList, color: string);
    /** Rebinds saved column references to the new metadata objects (preserves indices, etc.). */
    updateColumnsIndex(metadataList: TapMetadataList['_metadataList']): void;
    private setRAColumns;
    private setDecColumns;
    private setNameColumn;
    changeColor(color: string): void;
    changeMetaName(metacolumnName: string): void;
    /** Returns true to indicate a refresh-by-FoV is needed (preserves original behavior). */
    changeCatalogueMetaRA(metacolumnName: string): boolean;
    /** Returns true to indicate a refresh-by-FoV is needed (preserves original behavior). */
    changeCatalogueMetaDec(metacolumnName: string): boolean;
    resetCatalogueMetaShapeSize(): void;
    changeCatalogueMetaShapeSize(metacolumnName: string): void;
    resetCatalogueMetaShapeHue(): void;
    changeCatalogueMetaShapeHue(metacolumnName: string): void;
}
//# sourceMappingURL=CatalogueProps.d.ts.map