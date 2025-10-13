export function parseHipsList(text) {
    const out = [];
    let current = null;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line || line.startsWith('#'))
            continue;
        const [k, ...rest] = line.split('=');
        const key = k?.trim();
        const val = rest.join('=').trim();
        if (key === 'hips_service_url') {
            // start a new block
            if (current)
                out.push(current);
            current = { hips_service_url: val };
        }
        else if (current && (key === 'hips_release_date' || key === 'creator_did')) {
            current[key] = val;
        }
    }
    if (current)
        out.push(current);
    return out;
}
//# sourceMappingURL=parse-hipslist.js.map