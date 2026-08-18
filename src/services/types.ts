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

import { HiPSDescriptor } from '../model/hips/HiPSDescriptor.js'

export interface HiPSItem {
  id: number
  hipsDescriptor: HiPSDescriptor | null
  provider: string
  hips: Record<string, unknown>
}

export interface HiPSNodeEntry {
  hips_service_url: string
  hips_release_date?: string
  creator_did?: string
}