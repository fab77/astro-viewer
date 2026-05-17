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

// hips-node-repo.ts
import {HiPSDescriptor} from '../model/hips/HiPSDescriptor.js'
import { toHttps, urlJoin, fetchText, fetchJson } from './helpers.js'
import { parseHipsList } from './parse-hipslist.js'
import type { HiPSItem } from './types.js'

let nextId = 1

export async function getHiPSNodeListFile(): Promise<unknown[]> {
  const url = new URL('http://localhost:4000/hips/nodelist')
  try {
    return await fetchJson<unknown[]>(url.toString())
  } catch (err) {
    console.log('[HiPSNodeRepo]', err)
    return []
  }
}

export async function getHiPSDescriptor(hipsUrl: string): Promise<HiPSDescriptor | null> {
  const httpsUrl = toHttps(hipsUrl)
  const propsUrl = urlJoin(httpsUrl, '/properties')
  try {
    const data = await fetchText(propsUrl)
    return new HiPSDescriptor(data, httpsUrl)
  } catch (err) {
    console.log('[HiPSNodeRepo] url', httpsUrl, '[Error]', err)
    return null
  }
}

export async function addHiPSNode(hipsNodeUrl: string): Promise<HiPSItem[]> {
  const listUrl = urlJoin(hipsNodeUrl, '/hipslist')
  const items: HiPSItem[] = []
  try {
    const text = await fetchText(listUrl)
    const entries = parseHipsList(text)

    for (const e of entries) {
      const url = e.hips_service_url?.trim()
      if (!url) continue
      const desc = await addHiPS(url)
      items.push({
        id: nextId++,
        hipsDescriptor: desc,
        provider: hipsNodeUrl,
        hips: {}
      })
    }
    return items
  } catch (err) {
    console.log('[HiPSNodeRepo]', err)
    return items
  }
}

export async function addHiPS(hipsUrl: string): Promise<HiPSDescriptor | null> {
  const httpsUrl = toHttps(hipsUrl)
  const propsUrl = urlJoin(httpsUrl, '/properties')
  try {
    const data = await fetchText(propsUrl)
    return new HiPSDescriptor(data, httpsUrl)
  } catch (err) {
    console.log('[HiPSNodeRepo] url', httpsUrl, '[Error]', err)
    return null
  }
}