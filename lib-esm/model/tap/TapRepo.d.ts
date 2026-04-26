/**
 * @author Fabrizio Giordano (Fab77)
 */
import { FootprintSetGL } from '../footprints/FootprintSetGL.js';
import { CatalogueGL } from '../catalogues/CatalogueGL.js';
export type ADQLFunction = string | {
    name: string;
    signature?: string;
    doc?: string;
};
export declare class TapRepo {
    private _adqlFunctionList;
    private _cataloguesList;
    private _observationsList;
    private _notClassified;
    private _tapBaseURL;
    constructor(tapUrl: string);
    get tapBaseUrl(): string;
    setCataloguesList(cataloguesList: CatalogueGL[]): void;
    setObservationsList(observationList: FootprintSetGL[]): void;
    setNotClassifiedList(notClassifiedList: unknown[]): void;
    get cataloguesList(): CatalogueGL[];
    get observationsList(): FootprintSetGL[];
    set adqlFunctionList(adqlFunctionList: ADQLFunction[] | undefined);
    get adqlFunctionList(): ADQLFunction[];
}
