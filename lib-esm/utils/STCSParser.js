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
/**
 * @author Fabrizio Giordano (Fab77)
 */
import { Point } from "../model/Point.js";
import { CoordsType } from "./CoordsType.js";
import global from "../Global.js";
class STCSParser {
    static parseSTCS(stcs, options = {}) {
        const stcsParsed = STCSParser.cleanStcs(stcs);
        let totPoints = 0;
        const polygons = [];
        if (stcsParsed.includes("POLYGON")) {
            return STCSParser.parsePolygon(stcsParsed, options);
        }
        else if (stcsParsed.includes("CIRCLE")) {
            return STCSParser.parseCircle(stcsParsed, options);
        }
        else {
            console.warn("STCS not recognised");
        }
        return { totpoints: totPoints, polygons };
    }
    static cleanStcs(stcs) {
        // Uppercase once
        let s = stcs.toUpperCase();
        // Remove tokens
        s = s
            .replace(/'ICRS'/g, '')
            .replace(/\bICRS\b/g, '')
            .replace(/\bJ2000\b/g, '')
            .replace(/\bUNION\b/g, '')
            .replace(/\bTOPOCENTER\b/g, '');
        // Remove parentheses
        s = s.replace(/[()]/g, '');
        // Collapse extra spaces and trim
        s = s.replace(/ {2,}/g, ' ').trim();
        return s;
    }
    static parsePolygon(stcs, options = {}) {
        let totPoints = 0;
        const polygons = [];
        const MAX_DECIMALS = global.MAX_DECIMALS ?? 12;
        const coordsType = options.coordsType ?? CoordsType.ASTRO;
        const polys = stcs.split("POLYGON ");
        for (let i = 1; i < polys.length; i++) {
            const currPoly = [];
            const points = polys[i].trim().split(" ");
            // If first point is repeated as last, remove the duplicate
            const p0 = Number(parseFloat(points[0]).toFixed(MAX_DECIMALS));
            const p1 = Number(parseFloat(points[1]).toFixed(MAX_DECIMALS));
            const plast0 = Number(parseFloat(points[points.length - 2]).toFixed(MAX_DECIMALS));
            const plast1 = Number(parseFloat(points[points.length - 1]).toFixed(MAX_DECIMALS));
            if (p0 === plast0 && p1 === plast1) {
                points.splice(points.length - 2, 2);
            }
            if (points.length > 2) {
                for (let p = 0; p < points.length - 1; p += 2) {
                    const xDeg = Number(parseFloat(points[p]).toFixed(MAX_DECIMALS));
                    const yDeg = Number(parseFloat(points[p + 1]).toFixed(MAX_DECIMALS));
                    const point = coordsType === CoordsType.GEOGRAPHIC
                        ? new Point({ lonDeg: xDeg, latDeg: yDeg }, CoordsType.GEOGRAPHIC)
                        : new Point({ raDeg: xDeg, decDeg: yDeg }, CoordsType.ASTRO);
                    currPoly.push(point);
                    totPoints += 1;
                }
                polygons.push(currPoly);
            }
        }
        return { totpoints: totPoints, polygons };
    }
    // Example format: "CIRCLE ICRS 8.739685 4.38147 0.027833"
    static parseCircle(stcs, options = {}) {
        let totPoints = 0;
        const polygons = [];
        const coordsType = options.coordsType ?? CoordsType.ASTRO;
        const polys = stcs.split("CIRCLE ");
        for (let i = 1; i < polys.length; i++) {
            const currPoly = [];
            const tokens = polys[i].trim().split(" ");
            const ra = Number(tokens[0]);
            const dec = Number(tokens[1]);
            const radius = Number(tokens[2]);
            const POINTS_PER_QUADRANT = 6;
            const npoints = POINTS_PER_QUADRANT * 4;
            const alpha = (2 * Math.PI) / npoints;
            // Generate points around the circle
            for (let p = npoints; p > 0; p--) {
                const curra = radius * Math.cos(p * alpha) + ra;
                const curdec = radius * Math.sin(p * alpha) + dec;
                const point = coordsType === CoordsType.GEOGRAPHIC
                    ? new Point({ lonDeg: curra, latDeg: curdec }, CoordsType.GEOGRAPHIC)
                    : new Point({ raDeg: curra, decDeg: curdec }, CoordsType.ASTRO);
                currPoly.push(point);
                totPoints += 1;
            }
            polygons.push(currPoly);
        }
        return { totpoints: totPoints, polygons };
    }
}
export default STCSParser;
