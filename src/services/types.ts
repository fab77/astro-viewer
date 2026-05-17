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