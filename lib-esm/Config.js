export const hipsNodes = [
    "https://skies.esac.esa.int/",
    "https://alasky.cds.unistra.fr/",
];
// If you want to re-enable multiple TAP repos, just uncomment and extend the array
// export const tapRepos: string[] = [
//   "https://archive.eso.org/tap_cat/",
//   "https://archive.eso.org/tap_obs/",
//   "https://sky.esa.int/esasky-tap/tap/",
//   "https://ws.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/argus",
// ];
export const tapRepos = [
    "https://sky.esa.int/esasky-tap/tap/",
];
export const bootSetup = {
    insideSphere: false,
    defaultHips: "",
    camera_fov_deg: 34,
    camera_fov_rad: 34 * Math.PI / 180.0,
    camera_near_plane: 0.00001,
    camera_far_plane: 2.5,
    corsProxyUrl: "http://localhost:4000/",
    useCORSProxy: false,
    maxDecimals: 15,
    // defaultHipsUrl: "//alasky.u-strasbg.fr/DSS/DSSColor/",
    defaultHipsUrl: "https://cdn.skies.esac.esa.int/DSSColor/",
    version: "Astrobrowser v1.0.0",
    debug: false,
    insideView: false,
    showViewfinder: false,
};
//# sourceMappingURL=Config.js.map