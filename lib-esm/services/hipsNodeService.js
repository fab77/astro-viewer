// hips-node-repo.ts
import { HiPSDescriptor } from '../model/hips/HiPSDescriptor.js';
import { toHttps, urlJoin, fetchText, fetchJson } from './helpers.js';
import { parseHipsList } from './parse-hipslist.js';
let nextId = 1;
export async function getHiPSNodeListFile() {
    const url = new URL('http://localhost:4000/hips/nodelist');
    try {
        return await fetchJson(url.toString());
    }
    catch (err) {
        console.log('[HiPSNodeRepo]', err);
        return [];
    }
}
export async function getHiPSDescriptor(hipsUrl) {
    const httpsUrl = toHttps(hipsUrl);
    const propsUrl = urlJoin(httpsUrl, '/properties');
    try {
        const data = await fetchText(propsUrl);
        return new HiPSDescriptor(data, httpsUrl);
    }
    catch (err) {
        console.log('[HiPSNodeRepo] url', httpsUrl, '[Error]', err);
        return null;
    }
}
export async function addHiPSNode(hipsNodeUrl) {
    const listUrl = urlJoin(hipsNodeUrl, '/hipslist');
    const items = [];
    try {
        const text = await fetchText(listUrl);
        const entries = parseHipsList(text);
        for (const e of entries) {
            const url = e.hips_service_url?.trim();
            if (!url)
                continue;
            const desc = await addHiPS(url);
            items.push({
                id: nextId++,
                hipsDescriptor: desc,
                provider: hipsNodeUrl,
                hips: {}
            });
        }
        return items;
    }
    catch (err) {
        console.log('[HiPSNodeRepo]', err);
        return items;
    }
}
export async function addHiPS(hipsUrl) {
    const httpsUrl = toHttps(hipsUrl);
    const propsUrl = urlJoin(httpsUrl, '/properties');
    try {
        const data = await fetchText(propsUrl);
        return new HiPSDescriptor(data, httpsUrl);
    }
    catch (err) {
        console.log('[HiPSNodeRepo] url', httpsUrl, '[Error]', err);
        return null;
    }
}
