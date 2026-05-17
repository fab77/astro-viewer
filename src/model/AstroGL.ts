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

import {Footprint} from "./footprints/Footprint.js";
import { MetadataColumn } from "./MetadataColumn.js";
import { MetadataManager } from "./MetadataManager.js";
import {Source} from "./Source.js";

export interface AstroGL {

    addEntries(in_data: any[], columnsmeta: MetadataColumn[]): void;
    get entries(): Source[] | Footprint[];
    get metadataManager(): MetadataManager;
    changeColor(color: string): void;
    

}