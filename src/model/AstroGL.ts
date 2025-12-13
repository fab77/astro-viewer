import {Footprint} from "./footprints/Footprint.js";
import { MetadataColumn } from "./MetadataColumn.js";
import { MetadataManager } from "./MetadataManager.js";
import {Source} from "./Source.js";

export interface AstroGL {

    addEntries(in_data: any[], columnsmeta: MetadataColumn[]): void;
    get entries(): Source[] | Footprint[];
    get metadataManager(): MetadataManager;
    changeColor(color: string): void;
    

}