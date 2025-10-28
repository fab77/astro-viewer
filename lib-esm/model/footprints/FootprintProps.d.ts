import { TapMetadata } from '../tap/TapMetadata.js';
import { TapMetadataList } from '../tap/TapMetadataList.js';
export default class FootprintProps {
    pgSphereColumn?: TapMetadata;
    geomColumn?: TapMetadata;
    raColumn?: TapMetadata;
    decColumn?: TapMetadata;
    nameColumn?: TapMetadata;
    shapeColor: string;
    tapMetadataList: TapMetadataList;
    constructor(tapMetadataList: TapMetadataList, color: string);
    private setPositionColumns;
    private setNameColumn;
    changeColor(color: string): void;
    changeMetaName(metacolumnName: string): void;
    private getMetaName;
}
//# sourceMappingURL=FootprintProps.d.ts.map