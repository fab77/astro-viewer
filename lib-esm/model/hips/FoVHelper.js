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
// FoVHelper.ts
'use strict';
class FoVHelper {
    static LEVEL_HYSTERESIS = 0.12;
    static HIPS_ORDER_MIN_FOV = {
        0: 179,
        1: 90,
        2: 30,
        3: 20,
        4: 6,
        5: 3.2,
        6: 1.6,
        7: 0.85,
        8: 0.42,
        9: 0.21,
        10: 0.12,
        11: 0.06,
        12: 0.015,
        13: 0,
    };
    getHiPSNorder(fov, currentOrder) {
        const rawOrder = this.getRawHiPSNorder(fov);
        if (currentOrder === undefined || currentOrder === rawOrder)
            return rawOrder;
        if (rawOrder > currentOrder) {
            const boundary = FoVHelper.HIPS_ORDER_MIN_FOV[currentOrder];
            if (boundary > 0 && fov > boundary * (1 - FoVHelper.LEVEL_HYSTERESIS))
                return currentOrder;
        }
        else {
            const boundary = FoVHelper.HIPS_ORDER_MIN_FOV[rawOrder];
            if (boundary > 0 && fov < boundary * (1 + FoVHelper.LEVEL_HYSTERESIS))
                return currentOrder;
        }
        return rawOrder;
    }
    getRawHiPSNorder(fov) {
        if (fov >= 179)
            return 0;
        if (fov >= 90)
            return 1;
        if (fov >= 30)
            return 2;
        if (fov >= 20)
            return 3;
        if (fov >= 6)
            return 4;
        if (fov >= 3.2)
            return 5;
        if (fov >= 1.6)
            return 6;
        if (fov >= 0.85)
            return 7;
        if (fov >= 0.42)
            return 8;
        if (fov >= 0.21)
            return 9;
        if (fov >= 0.12)
            return 10;
        if (fov >= 0.06)
            return 11;
        if (fov >= 0.015)
            return 12;
        return 13;
    }
    getRADegSteps(fov, coarse = false) {
        let raStep;
        let decStep;
        if (coarse && fov < 0.21) {
            raStep = 10;
            decStep = 10;
        }
        else if (fov >= 179) {
            raStep = 10;
            decStep = 10;
        }
        else if (fov >= 25) {
            raStep = 9;
            decStep = 9;
        }
        else if (fov >= 12.5) {
            raStep = 8;
            decStep = 8;
        }
        else if (fov >= 6) {
            raStep = 6;
            decStep = 6;
        }
        else if (fov >= 3.2) {
            raStep = 5;
            decStep = 5;
        }
        else if (fov >= 1.6) {
            raStep = 4;
            decStep = 4;
        }
        else if (fov >= 0.85) {
            raStep = 3;
            decStep = 3;
        }
        else if (fov >= 0.42) {
            raStep = 2;
            decStep = 2;
        }
        else if (fov >= 0.21) {
            raStep = 1;
            decStep = 1;
        }
        else if (fov >= 0.12) {
            raStep = 0.5;
            decStep = 0.5;
        }
        else if (fov >= 0.06) {
            raStep = 0.25;
            decStep = 0.25;
        }
        else {
            raStep = 10;
            decStep = 10;
        }
        return { raStep, decStep };
    }
    getRefOrder(order) {
        switch (order) {
            case 0:
            case 1:
            case 2:
            case 3:
                return order + 6;
            case 4:
            case 5:
            case 6:
            case 7:
                return order + 5;
            case 8:
                return order + 4;
            default:
                return order + 3;
        }
    }
}
export const fovHelper = new FoVHelper();
export default FoVHelper;
