/**
 * @author Fabrizio Giordano (Fab)
 */
export type SesameResult = {
    ra: number;
    dec: number;
} | null;
declare class SesameService {
    private readonly baseURL;
    queryByTargetName(targetName: string): Promise<SesameResult>;
}
export declare const sesameService: SesameService;
export default sesameService;
