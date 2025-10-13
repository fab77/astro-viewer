// helpers.ts
export const toHttps = (url) => url.startsWith('http:') ? url.replace('http:', 'https:') : url;
export const urlJoin = (base, path) => new URL(path.replace(/^\/+/, ''), base).toString();
export async function fetchText(url) {
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);
    return res.text();
}
export async function fetchJson(url) {
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!res.ok)
        throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}
//# sourceMappingURL=helpers.js.map