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

// SesameService.ts
/**
 * @author Fabrizio Giordano (Fab)
 */

export type SesameResult = { ra: number; dec: number } | null

class SesameService {
  private readonly baseURL = 'https://cdsweb.u-strasbg.fr/cgi-bin/nph-sesame/-ox?'

  async queryByTargetName(targetName: string): Promise<SesameResult> {
    const url = this.baseURL + encodeURIComponent(targetName)

    try {
      const res = await fetch(url, { method: 'GET', mode: 'cors' })
      const raw = await res.text()
      const xmlStr = raw.replace(/\n\t|\t|\n/g, '')
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlStr, 'application/xml')

      const root = doc.firstElementChild
      if (!root) {
        console.error('Sesame XML parse error: missing root node')
        return null
      }
      if (doc.childElementCount > 1) {
        console.error('Sesame XML parse error: more than 1 root child')
        return null
      }

      // Iterate <Target> nodes
      for (const node of Array.from(root.children)) {
        if (node.nodeName !== 'Target') continue

        // Find first <Resolver> child with jradeg/jdedeg
        for (const resolver of Array.from(node.children)) {
          if (resolver.nodeName !== 'Resolver') continue

          const raNode = resolver.getElementsByTagName('jradeg')[0]
          const decNode = resolver.getElementsByTagName('jdedeg')[0]
          if (!raNode || !decNode) continue

          const ra = Number(raNode.textContent ?? '')
          const dec = Number(decNode.textContent ?? '')
          if (Number.isFinite(ra) && Number.isFinite(dec)) {
            return { ra, dec }
          }
        }
      }

      // Not found
      return null
    } catch (err) {
      console.error('Sesame query failed:', err)
      return null
    }
  }
}

export const sesameService = new SesameService()
export default sesameService