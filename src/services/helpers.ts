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

// helpers.ts
export const toHttps = (url: string) =>
  url.startsWith('http:') ? url.replace('http:', 'https:') : url

export const urlJoin = (base: string, path: string) =>
  new URL(path.replace(/^\/+/, ''), base).toString()

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { method: 'GET', mode: 'cors' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.text()
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'GET', mode: 'cors' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}