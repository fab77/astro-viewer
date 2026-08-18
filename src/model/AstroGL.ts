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