export declare const toHttps: (url: string) => string;
export declare const urlJoin: (base: string, path: string) => string;
export declare function fetchText(url: string): Promise<string>;
export declare function fetchJson<T>(url: string): Promise<T>;
