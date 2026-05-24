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

import { Footprint } from "./Footprint.js";
import { colorHex2RGB } from "../../utils/Utils.js";

import { FootprintShaderProgram } from "../../shader/FootprintShaderProgram.js";

import MouseHelper from "../../utils/MouseHelper.js";
import { Point } from "../Point.js";
import GeomUtils from "../../utils/GeomUtils.js";
import { CoordsType } from "../../utils/CoordsType.js";
import { MetadataManager } from "../MetadataManager.js";
import { MetadataColumn } from "../MetadataColumn.js";
import { VisibleTilesManager } from "../hips/VisibleTilesManager.js";

export interface HoveredFootprintDetail {
  // metadata: TapMetadataList
  metadata: MetadataManager;
  footprints: Footprint[];
  tableName: string;
  description: string;
  provider: string;
}

export type ClickedFootprintState = {
  footprint: Footprint;
  selected: boolean;
};

export type FootprintPickResult = {
  footprints: Footprint[];
  pickedIndexes: number[];
};

export type FootprintClickResult = {
  footprints: Footprint[];
  selectionState: ClickedFootprintState[];
};

export class FootprintSetGL {
  static ELEM_SIZE = 3;
  static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;
  static CONVEXPOLY_ELEM_SIZE = 3;

  _kind: string = "FootprintSetGL";
  _ready: boolean;
  // footprintsetProps: FootprintProps
  _name: string;
  _description: string;
  // tapRepo: TapRepo

  extHoveredIndexes!: Uint32Array;

  oldMouseCoords: any;
  healpixDensityMap: any;

  totConvexPoints!: number;

  // footprintsInPix256: Map<number, Footprint[]>

  // gl: GL;

  // shaderProgram: WebGLProgram
  vertexCataloguePositionBuffer!: WebGLBuffer;
  indexBuffer!: WebGLBuffer;

  hoveredVertexPositionBuffer!: WebGLBuffer;
  hoveredIndexBuffer!: WebGLBuffer;

  selectedVertexPositionBuffer!: WebGLBuffer;
  selectedIndexBuffer!: WebGLBuffer;

  indexes!: Uint32Array;
  footprintPolygons: Footprint[] = [];
  vertexCataloguePosition!: Float32Array;
  totPoints!: number;
  nPrimitiveFlags: number = 0;

  hoveredIndexes!: number[];
  hoveredElementIndexes!: Uint32Array;
  private _hoveredFootprints: Footprint[] = [];
  hoveredVertexPosition!: Float32Array;
  totHoveredPoints!: number;
  nHoveredPrimitiveFlags: number = 0;

  selectedIndexes!: number[];
  selectedElementIndexes!: Uint32Array;
  private _selectedFootprints: Footprint[] = [];
  selectedVertexPosition!: Float32Array;
  totSelectedPoints!: number;
  nSlectedPrimitiveFlags: number = 0;
  _shapeColor = "#00fff2ff";

  private _bufferInitialised = false;
  private _webgl: WebGL2RenderingContext;

  _isVisible: boolean = true;
  private _metadataManager: MetadataManager;

  _providerUrl: string;
  private _footprintShaderProgram: FootprintShaderProgram;
  private _visibleTilesManager: VisibleTilesManager;

  constructor(
    fsetName: string,
    fsetDescription: string,
    providerUrl: string,
    metadataManager: MetadataManager,
    webgl: WebGL2RenderingContext,
    visibleTilesManager: VisibleTilesManager,
  ) {
    this._webgl = webgl;
    this._ready = false;
    this._visibleTilesManager = visibleTilesManager;

    (this as any).TYPE = "FOOTPRINT_SET";

    this._name = fsetName;
    this._description = fsetDescription;
    this._providerUrl = providerUrl;

    this._metadataManager = metadataManager;

    this.initFootprintArrays();

    this.oldMouseCoords = null;

    this._footprintShaderProgram = new FootprintShaderProgram(this._webgl);
    this._footprintShaderProgram.shaderProgram;
  }

  private initFootprintArrays(): void {
    this.footprintPolygons = [];
    this.indexes = new Uint32Array();
    this.vertexCataloguePosition = new Float32Array();
    this.totPoints = 0;
    this.totConvexPoints = 0;
    this.extHoveredIndexes = new Uint32Array();

    this._hoveredFootprints = [];
    this.hoveredVertexPosition = new Float32Array();
    this.totHoveredPoints = 0;
    this.hoveredIndexes = [];
    this.hoveredElementIndexes = new Uint32Array();

    this._selectedFootprints = [];
    this.selectedVertexPosition = new Float32Array();
    this.totSelectedPoints = 0;
    this.selectedIndexes = [];
    this.selectedElementIndexes = new Uint32Array();
  }

  private initGLBuffers(): void {
    if (!this._webgl) return;
    this.vertexCataloguePositionBuffer = this._webgl.createBuffer();
    this.indexBuffer = this._webgl.createBuffer();

    this.hoveredVertexPositionBuffer = this._webgl.createBuffer();
    this.hoveredIndexBuffer = this._webgl.createBuffer();

    this.selectedVertexPositionBuffer = this._webgl.createBuffer();
    this.selectedIndexBuffer = this._webgl.createBuffer();
  }

  public setIsVisible(visibility: boolean) {
    this._isVisible = visibility;
  }

  get isVisible() {
    return this._isVisible;
  }

  get shapeColor() {
    return this._shapeColor;
  }

  get providerUrl() {
    return this._providerUrl;
  }

  get name() {
    return this._name;
  }

  get metadataManager() {
    return this._metadataManager;
  }

  addFootprint(in_footprint: Footprint): void {
    this.footprintPolygons.push(in_footprint);
  }

  // addFootprints(in_data: any[], columnsmeta: TapMetadata[]): void {
  addFootprints(in_data: any[], columnsmeta: MetadataColumn[]): void {
    this._ready = false;

    this._metadataManager = new MetadataManager(columnsmeta);

    // const geomDataIndex = this.footprintsetProps.geomColumn?.index
    const geomDataIndex =
      this._metadataManager.selectedOutlineColumn?.index ?? -1;

    if (geomDataIndex < 0) {
      throw new Error(
        "geomColumn or its index is undefined in footprintsetProps",
      );
    }

    for (let j = 0; j < in_data.length; j++) {
      if (in_data[j][geomDataIndex] !== null) {
        const footprint = new Footprint(in_data[j][geomDataIndex], in_data[j]);
        if ((footprint as any)._valid) {
          this.addFootprint(footprint);
          this.totPoints += footprint.totPoints;
          this.totConvexPoints += footprint.totConvexPoints;
        }
      }
    }

    // this.initBuffer()
    this._ready = true;
    this._bufferInitialised = false;
  }

  clearFootprints(): void {
    this.initFootprintArrays();
  }

  private initBuffer(): void {
    // this._webgl = webgl
    if (!this._webgl) return;
    this.initGLBuffers();

    const nFootprints = this.footprintPolygons.length;
    let npolygons = nFootprints - 1;

    for (let j = 0; j < nFootprints; j++) {
      npolygons += this.footprintPolygons[j].polygons.length - 1;
    }

    this.indexes = new Uint32Array(this.totPoints + npolygons + 1);
    const MAX_UNSIGNED_INT = 0xffffffff;

    this._webgl.bindBuffer(
      this._webgl.ARRAY_BUFFER,
      this.vertexCataloguePositionBuffer,
    );
    this.vertexCataloguePosition = new Float32Array(3 * this.totPoints);

    let positionIndex = 0;
    let vIdx = 0;
    const R = 1.0;
    this.nPrimitiveFlags = 0;

    for (let j = 0; j < nFootprints; j++) {
      const footprint = this.footprintPolygons[j];
      const footprintPoly = footprint.polygons;

      if (j > 0) {
        this.indexes[vIdx++] = MAX_UNSIGNED_INT;
        this.nPrimitiveFlags++;
      }

      for (const poly of footprintPoly) {
        if (poly !== footprintPoly[0]) {
          this.indexes[vIdx++] = MAX_UNSIGNED_INT;
          this.nPrimitiveFlags++;
        }

        for (const point of poly) {
          this.vertexCataloguePosition[positionIndex++] = R * point.x;
          this.vertexCataloguePosition[positionIndex++] = R * point.y;
          this.vertexCataloguePosition[positionIndex++] = R * point.z;
          this.indexes[vIdx++] = Math.floor((positionIndex - 1) / 3);
        }
      }
    }

    this.indexes[this.indexes.length - 1] = MAX_UNSIGNED_INT;

    this._webgl.bindBuffer(
      this._webgl.ARRAY_BUFFER,
      this.vertexCataloguePositionBuffer,
    );
    this._webgl.bufferData(
      this._webgl.ARRAY_BUFFER,
      this.vertexCataloguePosition,
      this._webgl.STATIC_DRAW,
    );

    this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this._webgl.bufferData(
      this._webgl.ELEMENT_ARRAY_BUFFER,
      this.indexes,
      this._webgl.STATIC_DRAW,
    );

    this._bufferInitialised = true;
    console.log("Buffer initialized");
  }

  checkSelection(mouseHelper: MouseHelper) {
    if (!mouseHelper.x || !mouseHelper.y || !mouseHelper.z) return;

    let mousePix = mouseHelper.computeNpix();
    if (!mousePix) return;

    this._hoveredFootprints = [];
    this.totHoveredPoints = 0;

    const mousePoint = new Point(
      { x: mouseHelper.x, y: mouseHelper.y, z: mouseHelper.z },
      CoordsType.CARTESIAN,
    );

    for (let i = 0; i < this.footprintPolygons.length; i++) {
      const footprint: Footprint = this.footprintPolygons[i];
      if (!footprint.selectionObj) continue;

      if (
        GeomUtils.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)
      ) {
        const details = [...footprint.details];
        // const geomDataIndex = this.footprintsetProps.geomColumn?.index
        const geomDataIndex =
          this._metadataManager.selectedOutlineColumn?.index ?? -1;

        if (geomDataIndex < 0) continue;

        details.splice(geomDataIndex, 1);
        this._hoveredFootprints.push(footprint);
        this.totHoveredPoints += footprint.totPoints;
      }
    }
    this.initHoveringBuffer();
  }

  get hoveredFootprints(): HoveredFootprintDetail {
    return {
      // metadata: this.footprintsetProps.tapMetadataList,
      metadata: this._metadataManager,
      footprints: this._hoveredFootprints,
      tableName: this._name,
      description: this._description,
      // provider: this.tapRepo.tapBaseUrl
      provider: this._providerUrl,
    };
  }

  get selectedFootprints(): Footprint[] {
    return this._selectedFootprints;
  }

  private checkClicking(in_mouseHelper: MouseHelper): number[] {
    if (
      in_mouseHelper.x == null ||
      in_mouseHelper.y == null ||
      in_mouseHelper.z == null
    ) {
      return [];
    }

    const clickedIndexes: number[] = [];
    const mousePoint = new Point(
      { x: in_mouseHelper.x, y: in_mouseHelper.y, z: in_mouseHelper.z },
      CoordsType.CARTESIAN,
    );

    for (let i = 0; i < this.footprintPolygons.length; i++) {
      const footprint = this.footprintPolygons[i];
      if (!footprint.selectionObj) continue;

      if (
        GeomUtils.checkPointInsidePolygon5(footprint.selectionObj, mousePoint)
      ) {
        clickedIndexes.push(i);
      }
    }

    return clickedIndexes;
  }

  private setSelectedIndexes(selectedIndex: number[]) {
    selectedIndex.forEach((idx) => {
      if (idx < 0 || idx >= this.footprintPolygons.length) return;

      if (this.selectedIndexes.includes(idx)) {
        this.selectedIndexes.splice(this.selectedIndexes.indexOf(idx), 1);
      } else {
        this.selectedIndexes.push(idx);
      }
    });

    this.refreshSelectedFootprints();
  }

  private refreshSelectedFootprints() {
    this._selectedFootprints = this.selectedIndexes
      .map((idx) => this.footprintPolygons[idx])
      .filter((footprint): footprint is Footprint => Boolean(footprint));
    this.totSelectedPoints = this._selectedFootprints.reduce(
      (total, footprint) => total + footprint.totPoints,
      0,
    );

    if (this._selectedFootprints.length === 0) {
      this.selectedVertexPosition = new Float32Array();
      this.selectedElementIndexes = new Uint32Array();
      this.nSlectedPrimitiveFlags = 0;
      return;
    }

    this.initSelectionBuffer();
  }

  getFootprintsFromPointer(
    in_mouseHelper: MouseHelper,
  ): FootprintPickResult | null {
    const pickedIndexes = this.checkClicking(in_mouseHelper);
    if (!pickedIndexes.length) {
      return {
        footprints: [],
        pickedIndexes: [],
      };
    }

    const footprints: Footprint[] = [];
    pickedIndexes.forEach((idx) => {
      const footprint = this.footprintPolygons[idx];
      if (footprint) footprints.push(footprint);
    });

    return footprints.length ? { footprints, pickedIndexes } : null;
  }

  selectPrimaryFootprintFromClick(
    in_mouseHelper: MouseHelper,
  ): FootprintClickResult | null {
    const picked = this.getFootprintsFromPointer(in_mouseHelper);
    const clickedIndexes = picked?.pickedIndexes ?? [];

    this.setSelectedIndexes(clickedIndexes);
    if (!clickedIndexes.length) {
      return {
        footprints: [],
        selectionState: [],
      };
    }

    const selectionState: ClickedFootprintState[] = [];
    const selectedFootprints: Footprint[] = [];

    clickedIndexes.forEach((idx) => {
      const footprint = this.footprintPolygons[idx];
      if (!footprint) return;

      const selected = this.selectedIndexes.includes(idx);
      selectionState.push({ footprint, selected });
      selectedFootprints.push(footprint);
    });

    return selectedFootprints.length
      ? { footprints: selectedFootprints, selectionState }
      : null;
  }

  // highlightFootprint(footprint: Footprint, highlighted: boolean) {
  //   if (highlighted) {
  //     this._hoveredFootprints.push(footprint)
  //     this.totHoveredPoints += footprint.totPoints
  //   } else {
  //     const indexOfFootprint = this._hoveredFootprints.indexOf(footprint)
  //     this._hoveredFootprints.splice(indexOfFootprint, 1)
  //     this.totHoveredPoints -= footprint.totPoints
  //   }
  //   this.initHoveringBuffer()
  // }

  /**
   *
   * @param {Footprint[]} footprints
   */

  // addFootprint2Selected(footprints: Footprint[]) {
  //   let refreshBuffer = false
  //   for (let f of footprints) {
  //     if (!this._selectedFootprints.includes(f)) {
  //       this._selectedFootprints.push(f)
  //       this.totSelectedPoints += f.totPoints
  //       refreshBuffer = true
  //     }
  //   }
  //   if (refreshBuffer) {
  //     this.initSelectionBuffer()
  //   }
  // }

  /**
   *
   * @param {Footprint} footprint
   */
  // removeFootprintFromSelection(footprint: Footprint) {
  //   const indexOfObject = this._selectedFootprints.indexOf(footprint)
  //   if (indexOfObject >= 0) {
  //     this._selectedFootprints.splice(indexOfObject, 1)
  //     this.totSelectedPoints -= footprint.totPoints
  //     if (this._selectedFootprints.length > 0) {
  //       this.initSelectionBuffer()
  //     }
  //   }

  // }

  private FootprintPolygonMatches(left: Footprint, right: Footprint): boolean {
          if (left === right) return true;
  
          const leftConvexPoly = left.convexPolygons;
          const rightConvexPoly = right.convexPolygons;
          if (
              leftConvexPoly !== rightConvexPoly ||
              leftConvexPoly !== rightConvexPoly
          ) {
              return false;
          }
  
          if (left.details.length !== right.details.length) {
              return false;
          }
  
          for (let i = 0; i < left.details.length; i++) {
              if (!Object.is(left.details[i], right.details[i])) {
                  return false;
              }
          }
  
          return true;
      }
  

  private findFootprintPolygonIndex(footprint: Footprint): number {
    const footprintIndex = this.footprintPolygons.indexOf(footprint);
    if (footprintIndex >= 0) {
      return footprintIndex;
    }

    return this.footprintPolygons.findIndex((candidate) =>
      this.FootprintPolygonMatches(candidate, footprint),
    );
  }

  extHighlightFootprint(footprint: Footprint, highlighted: boolean) {
    const sIdx = this.findFootprintPolygonIndex(footprint);
        if (sIdx < 0) return;
        const base = sIdx * FootprintSetGL.ELEM_SIZE;
        if (highlighted) {
            if (!this.hoveredIndexes.includes(sIdx)) {
                this.hoveredIndexes.push(sIdx);
            }
        } else {
            
            if (base + 4 >= this.vertexCataloguePosition.length) return;
            const i = this.hoveredIndexes.indexOf(sIdx);
            if (i >= 0) {
                this.hoveredIndexes.splice(i, 1);
            }
        }
  }

  extAddPolygons2Selected(footprint: Footprint) {
    if (!this._bufferInitialised) {
            this.initBuffer();
        }
        const sIdx = this.findFootprintPolygonIndex(footprint);
        if (sIdx < 0) return;
        const base = sIdx * FootprintSetGL.ELEM_SIZE;
        
        if (!this.selectedIndexes.includes(sIdx)) {
            this.selectedIndexes.push(sIdx);
        } else {
            if (base + 4 >= this.vertexCataloguePosition.length) return;
            const i = this.selectedIndexes.indexOf(sIdx);
            if (i >= 0) {
                this.selectedIndexes.splice(i, 1);
            }
        }
        this.refreshSelectedFootprints();
  }

  initHoveringBuffer() {
    /*
            TODO better approach. when creating the indexbuffer of footprints, 
            add 1 extra position for the selection (set to 0 == not selected), 
            and save the position "positionIndex" in an array (selectionIndexes).
            When checking the selection, I get the index of the footprint, which
            matches with the index in the selectionIndexes to retrieve the position 
            of the flag to be set to 1 in the vertexposition
            This will ease checking the selection in the vertex/fragment shader and
            set the pointsize and shape color.
            */

    if (!this._webgl) return;
    if (this._hoveredFootprints.length == 0) {
      return;
    }
    let nFootprints = this._hoveredFootprints.length;

    let npolygons = nFootprints - 1;
    for (let j = 0; j < nFootprints; j++) {
      npolygons += this._hoveredFootprints[j].polygons.length - 1;
    }
    // this._selectedIndex = new Uint16Array(this._totSelectedPoints + npolygons);
    // let MAX_UNSIGNED_SHORT = 65535; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX

    this.hoveredElementIndexes = new Uint32Array(
      this.totHoveredPoints + npolygons,
    );
    const MAX_UNSIGNED_INT = 0xffffffff; // this is used to enable and disable GL_PRIMITIVE_RESTART_FIXED_INDEX
    // let MAX_UNSIGNED_SHORT = Number.MAX_SAFE_INTEGER;

    this._webgl.bindBuffer(
      this._webgl.ARRAY_BUFFER,
      this.hoveredVertexPositionBuffer,
    );

    this.hoveredVertexPosition = new Float32Array(3 * this.totHoveredPoints);
    let positionIndex = 0;
    let vIdx = 0;

    let R = 1.0;
    this.nHoveredPrimitiveFlags = 0;

    for (let j = 0; j < nFootprints; j++) {
      let hoveredFootprintPoly = this._hoveredFootprints[j].polygons;

      if (j > 0) {
        this.hoveredElementIndexes[vIdx] = MAX_UNSIGNED_INT;
        this.nHoveredPrimitiveFlags += 1;
        vIdx += 1;
      }

      for (let polyIdx = 0; polyIdx < hoveredFootprintPoly.length; polyIdx++) {
        if (polyIdx > 0) {
          this.hoveredElementIndexes[vIdx] = MAX_UNSIGNED_INT;
          this.nHoveredPrimitiveFlags += 1;
          vIdx += 1;
        }
        const poly = hoveredFootprintPoly[polyIdx];
        for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
          const p = poly[pointIdx];
          this.hoveredVertexPosition[positionIndex] = R * p.x;
          this.hoveredVertexPosition[positionIndex + 1] = R * p.y;
          this.hoveredVertexPosition[positionIndex + 2] = R * p.z;

          this.hoveredElementIndexes[vIdx] = Math.floor(positionIndex / 3);

          vIdx += 1;
          positionIndex += 3;
        }
      }
    }
  }

  initSelectionBuffer() {
    if (!this._webgl) return;
    if (this._selectedFootprints.length == 0) {
      return;
    }

    const nFootprints = this._selectedFootprints.length;
    let npolygons = nFootprints - 1;
    for (let j = 0; j < nFootprints; j++) {
      npolygons += this._selectedFootprints[j].polygons.length - 1;
    }

    this.selectedElementIndexes = new Uint32Array(
      this.totSelectedPoints + npolygons,
    );
    const MAX_UNSIGNED_INT = 0xffffffff;

    this._webgl.bindBuffer(
      this._webgl.ARRAY_BUFFER,
      this.selectedVertexPositionBuffer,
    );

    this.selectedVertexPosition = new Float32Array(3 * this.totSelectedPoints);
    let positionIndex = 0;
    let vIdx = 0;

    const R = 1.0;
    this.nSlectedPrimitiveFlags = 0;

    for (let j = 0; j < nFootprints; j++) {
      const footprintPoly = this._selectedFootprints[j].polygons;

      if (j > 0) {
        this.selectedElementIndexes[vIdx] = MAX_UNSIGNED_INT;
        this.nSlectedPrimitiveFlags += 1;
        vIdx += 1;
      }

      for (let polyIdx = 0; polyIdx < footprintPoly.length; polyIdx++) {
        if (polyIdx > 0) {
          this.selectedElementIndexes[vIdx] = MAX_UNSIGNED_INT;
          this.nSlectedPrimitiveFlags += 1;
          vIdx += 1;
        }
        const poly = footprintPoly[polyIdx];
        for (let pointIdx = 0; pointIdx < poly.length; pointIdx++) {
          const p = poly[pointIdx];
          this.selectedVertexPosition[positionIndex] = R * p.x;
          this.selectedVertexPosition[positionIndex + 1] = R * p.y;
          this.selectedVertexPosition[positionIndex + 2] = R * p.z;

          this.selectedElementIndexes[vIdx] = Math.floor(positionIndex / 3);

          vIdx += 1;
          positionIndex += 3;
        }
      }
    }
  }

  changeColor(color: string): void {
    this._shapeColor = color;
  }

  draw(
    in_mMatrix: Float32Array,
    in_mouseHelper: MouseHelper,
    vMatrix: Float32Array,
    pMatrix: Float32Array,
  ): void {
    if (!this.isVisible) return;
    if (!this._ready) return;
    if (!vMatrix) return;
    // if (!global.camera) return
    if (!this._bufferInitialised) this.initBuffer();
    if (!this._webgl) return;

    this._footprintShaderProgram.enableShaders(pMatrix, in_mMatrix, vMatrix);
    // this._footprintShaderProgram.enableShaders(
    //   computePerspectiveMatrixSingleton.pMatrix as Float32Array,
    //   in_mMatrix,
    //   vMatrix
    // )

    if (in_mouseHelper != null && in_mouseHelper.xyz != this.oldMouseCoords) {
      this.checkSelection(in_mouseHelper);
    }

    if (this._hoveredFootprints.length > 0) {
      // TODO POINT_SIZE doesn't have any effect on line thickness!! it only applies to points
      const rgb = colorHex2RGB("#00FF00");
      const alpha = 1.0;
      this._webgl.uniform4f(
        this._footprintShaderProgram.locations.color,
        rgb[0],
        rgb[1],
        rgb[2],
        alpha,
      );
      this._webgl.uniform1f(
        this._footprintShaderProgram.locations.pointSize,
        14.0,
      ); // <--- POINT_SIZE in LINE_LOOP is not applicable

      this._webgl.bindBuffer(
        this._webgl.ARRAY_BUFFER,
        this.hoveredVertexPositionBuffer,
      );
      this._webgl.bufferData(
        this._webgl.ARRAY_BUFFER,
        this.hoveredVertexPosition,
        this._webgl.STATIC_DRAW,
      );

      // setting footprint position
      this._webgl.vertexAttribPointer(
        this._footprintShaderProgram.locations.position,
        FootprintSetGL.ELEM_SIZE,
        this._webgl.FLOAT,
        false,
        FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
        0,
      );
      this._webgl.enableVertexAttribArray(
        this._footprintShaderProgram.locations.position,
      );

      this._webgl.bindBuffer(
        this._webgl.ELEMENT_ARRAY_BUFFER,
        this.hoveredIndexBuffer,
      );
      this._webgl.bufferData(
        this._webgl.ELEMENT_ARRAY_BUFFER,
        this.hoveredElementIndexes,
        this._webgl.STATIC_DRAW,
      );

      // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
      this._webgl.drawElements(
        this._webgl.LINE_LOOP,
        this.hoveredVertexPosition.length / 3 + this.nHoveredPrimitiveFlags,
        this._webgl.UNSIGNED_INT,
        0,
      );
    }

    if (this._selectedFootprints.length > 0) {
      const rgb = colorHex2RGB("#ECB462");
      const alpha = 1.0;
      this._webgl.uniform4f(
        this._footprintShaderProgram.locations.color,
        rgb[0],
        rgb[1],
        rgb[2],
        alpha,
      );
      this._webgl.uniform1f(
        this._footprintShaderProgram.locations.pointSize,
        14.0,
      ); // <--- POINT_SIZE in LINE_LOOP is not applicable

      this._webgl.bindBuffer(
        this._webgl.ARRAY_BUFFER,
        this.selectedVertexPositionBuffer,
      );
      this._webgl.bufferData(
        this._webgl.ARRAY_BUFFER,
        this.selectedVertexPosition,
        this._webgl.STATIC_DRAW,
      );

      // setting footprint position
      this._webgl.vertexAttribPointer(
        this._footprintShaderProgram.locations.position,
        FootprintSetGL.ELEM_SIZE,
        this._webgl.FLOAT,
        false,
        FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
        0,
      );
      this._webgl.enableVertexAttribArray(
        this._footprintShaderProgram.locations.position,
      );

      this._webgl.bindBuffer(
        this._webgl.ELEMENT_ARRAY_BUFFER,
        this.selectedIndexBuffer,
      );
      this._webgl.bufferData(
        this._webgl.ELEMENT_ARRAY_BUFFER,
        this.selectedElementIndexes,
        this._webgl.STATIC_DRAW,
      );

      // this._gl.drawElements (this._gl.LINE_LOOP, this._selectedVertexPosition.length / 3 + this._nSlectedPrimitiveFlags,this._gl.UNSIGNED_SHORT, 0);
      this._webgl.drawElements(
        this._webgl.LINE_LOOP,
        this.selectedVertexPosition.length / 3 + this.nSlectedPrimitiveFlags,
        this._webgl.UNSIGNED_INT,
        0,
      );
    }

    this._webgl.bindBuffer(
      this._webgl.ARRAY_BUFFER,
      this.vertexCataloguePositionBuffer,
    );

    this._webgl.vertexAttribPointer(
      this._footprintShaderProgram.locations.position as number,
      FootprintSetGL.ELEM_SIZE,
      this._webgl.FLOAT,
      false,
      FootprintSetGL.BYTES_X_ELEM * FootprintSetGL.ELEM_SIZE,
      0,
    );
    this._webgl.enableVertexAttribArray(
      this._footprintShaderProgram.locations.position as number,
    );

    this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // const shapeColor = [...colorHex2RGB(this.footprintsetProps.shapeColor), 1.0] as [number, number, number, number]
    const shapeColor = [...colorHex2RGB(this._shapeColor), 1.0] as [
      number,
      number,
      number,
      number,
    ];
    this._webgl.uniform4f(
      this._footprintShaderProgram.locations.color as WebGLUniformLocation,
      ...shapeColor,
    );

    this._webgl.drawElements(
      this._webgl.LINE_LOOP,
      this.indexes.length,
      this._webgl.UNSIGNED_INT,
      0,
    );

    this._webgl.bindBuffer(this._webgl.ARRAY_BUFFER, null);
    this._webgl.bindBuffer(this._webgl.ELEMENT_ARRAY_BUFFER, null);
    this.oldMouseCoords = in_mouseHelper.xyz;
  }
}

// export default FootprintSetGL
