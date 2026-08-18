/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-AstroViewer-Commercial
 *
 * AstroViewer is dual-licensed under the GNU Affero General Public License
 * version 3 and a separate commercial license.
 *
 * See LICENSE.md, LICENSE-AGPL.md, and LICENSE-COMMERCIAL.md for details.
 */

// parse-hipslist.ts
import type { HiPSNodeEntry } from './types.js'

export function parseHipsList(text: string): HiPSNodeEntry[] {
  const out: HiPSNodeEntry[] = []
  let current: HiPSNodeEntry | null = null

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const [k, ...rest] = line.split('=')
    const key = k?.trim()
    const val = rest.join('=').trim()

    if (key === 'hips_service_url') {
      // start a new block
      if (current) out.push(current)
      current = { hips_service_url: val }
    } else if (current && (key === 'hips_release_date' || key === 'creator_did')) {
      current[key] = val
    }
  }
  if (current) out.push(current)
  return out
}