import { TapRepo } from '../model/tap/TapRepo.js';
import { CatalogueGL } from '../model/catalogues/CatalogueGL.js';
import { FootprintSetGL } from '../model/footprints/FootprintSetGL.js';
export interface TapDatasets {
    obsList: FootprintSetGL[];
    catalogueList: CatalogueGL[];
    notClassifiedList: string[];
}
/**
 * Initialize a TapRepo and populate capabilities + datasets.
 */
export declare function addTAPRepo(repoUrl: string): Promise<TapRepo>;
export declare function queryAsync(tapRepo: TapRepo, adql: string, TAP_QUERY_TIMEOUT_MS: number): Promise<any | null>;
//# sourceMappingURL=tapRepoService.d.ts.map