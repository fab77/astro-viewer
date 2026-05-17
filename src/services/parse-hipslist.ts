/*
 * AstroViewer
 * Copyright (C) Fabrizio Giordano
 * SPDX-License-Identifier: LicenseRef-AstroViewer-Dual-License
 *
 * This file is part of AstroViewer.
 * AstroViewer is distributed under a dual-license model.
 * Commercial use requires a separate commercial license.
 * Non-commercial use is governed by LICENSE-NONCOMMERCIAL.md.
 *
 * See LICENSE.md, LICENSE-COMMERCIAL.md, and LICENSE-NONCOMMERCIAL.md for details.
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