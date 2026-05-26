export declare const hipsNodes: string[];
export declare const tapRepos: string[];
export interface BootSetup {
    insideSphere: boolean;
    defaultHips: string;
    camera_fov_deg: number;
    camera_fov_rad: number;
    inside_camera_fov_deg: number;
    inside_camera_fov_rad: number;
    camera_near_plane: number;
    camera_far_plane: number;
    corsProxyUrl: string;
    useCORSProxy: boolean;
    maxDecimals: number;
    defaultHipsUrl: string;
    version: string;
    debug: boolean;
    insideView: boolean;
    showViewfinder: boolean;
}
export declare const bootSetup: BootSetup;
