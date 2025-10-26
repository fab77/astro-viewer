/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { vec4, mat4, ReadonlyMat4 } from 'gl-matrix';

import global from '../../Global.js';
import { fovHelper } from '../hips/FoVHelper.js';
import { colorHex2RGB, degToRad } from '../../utils/Utils.js';
import GridShaderManager from '../../shader/GridShaderManager.js';
import Point from '../Point.js';
import CoordsType from '../../utils/CoordsType.js';
import FoVUtils from '../../utils/FoVUtils.js';

import GridTextHelper from './GridTextHelper.js';
import HealpixGridSingleton from './HealpixGridSingleton.js';
import AbstractSkyEntity from '../AbstractSkyEntity.js';
import healpixGridSingleton from './HealpixGridSingleton.js';
import computePerspectiveMatrixSingleton from '../../utils/ComputePerspectiveMatrix.js';

type GL = WebGLRenderingContext | WebGL2RenderingContext;

/** Equatorial grid rendered as RA/Dec great-circle line loops */
class EquatorialGrid extends AbstractSkyEntity {
	static ELEM_SIZE = 3;
	static BYTES_X_ELEM = new Float32Array().BYTES_PER_ELEMENT;

	private showGrid: boolean = false

	// private _gl: GL;
	private _shaderProgram!: WebGLProgram;
	private _vertexShader!: WebGLShader;
	private _fragmentShader!: WebGLShader;

	private defaultColor = '#41d421'
	private gridText: GridTextHelper = new GridTextHelper()

	private _attribLocations: { position: number; selected: number; pointSize: number; color: number } = {
		position: 0,
		selected: 1,
		pointSize: 2,
		color: 3,
	};


	private _phiVertexPositionBuffer!: WebGLBuffer;
	private _thetaVertexPositionBuffer!: WebGLBuffer;

	private _fov!: number;

	// Step sizes (degrees + radians) and label caches
	private _phiStep = 0;
	private _phiStepRad = 0;
	private _thetaStep = 0;
	private _thetaStepRad = 0;

	private _phiArray: Float32Array[] = [];
	private _thetaArray: Float32Array[] = [];

	// For placing text labels near current view center:
	//  - _dec4Labels: key = RA(deg), value = points along that RA ring (for Dec labels)
	//  - _ra4Labels : key = Dec(deg), value = points along that Dec ring (for RA labels)
	private _dec4Labels: Map<number, number[][]> = new Map();
	private _ra4Labels: Map<number, number[][]> = new Map();

	/**
	 * @param radius Not used by current implementation (sphere is unit-radius)
	 * @param fov    Field of view in degrees
	 */
	constructor() {
		super(HealpixGridSingleton.RADIUS, HealpixGridSingleton.INITIAL_POSITION, HealpixGridSingleton.INITIAL_PhiRad, HealpixGridSingleton.INITIAL_ThetaRad, 'equatorial-grid');
	}

	init(fov: number) {
		this._fov = fov

		this.initGL(global.gl as GL);

		// Program & buffers
		this._shaderProgram = (global.gl as GL).createProgram() as WebGLProgram;
		this.initShaders();

		this._phiVertexPositionBuffer = (global.gl as GL).createBuffer()!;
		this._thetaVertexPositionBuffer = (global.gl as GL).createBuffer()!;

		// Build initial RA/Dec line buffers
		this.initBuffers(this._fov);
	}

	/** Compile/link shaders and fetch uniform/attribute locations */
	private initShaders(): void {
		// Fragment
		const fsSource = GridShaderManager.healpixGridFS();
		this._fragmentShader = (global.gl as GL).createShader((global.gl as GL).FRAGMENT_SHADER)!;
		(global.gl as GL).shaderSource(this._fragmentShader, fsSource);
		(global.gl as GL).compileShader(this._fragmentShader);
		if (!(global.gl as GL).getShaderParameter(this._fragmentShader, (global.gl as GL).COMPILE_STATUS)) {
			// Keep identical behavior (alert) but surface errors in console too
			const log = (global.gl as GL).getShaderInfoLog(this._fragmentShader) || 'Unknown fragment shader error';
			console.error(log);
			alert(log);
			return;
		}

		// Vertex
		const vsSource = GridShaderManager.healpixGridVS();
		this._vertexShader = (global.gl as GL).createShader((global.gl as GL).VERTEX_SHADER)!;
		(global.gl as GL).shaderSource(this._vertexShader, vsSource);
		(global.gl as GL).compileShader(this._vertexShader);
		if (!(global.gl as GL).getShaderParameter(this._vertexShader, (global.gl as GL).COMPILE_STATUS)) {
			const log = (global.gl as GL).getShaderInfoLog(this._vertexShader) || 'Unknown vertex shader error';
			console.error(log);
			alert(log);
			return;
		}

		// Link
		(global.gl as GL).attachShader(this._shaderProgram, this._vertexShader);
		(global.gl as GL).attachShader(this._shaderProgram, this._fragmentShader);
		(global.gl as GL).linkProgram(this._shaderProgram);

		if (!(global.gl as GL).getProgramParameter(this._shaderProgram, (global.gl as GL).LINK_STATUS)) {
			alert('Could not initialise shaders');
		}

		(global.gl as GL).useProgram(this._shaderProgram);

	}

	/** Build RA/Dec line vertex arrays based on FoV step helper */
	private initBuffers(fovDeg: number): void {
		const R = 1.0;

		const steps = fovHelper.getRADegSteps(fovDeg);
		const phiStep = steps.raStep as number;   // RA step (deg)
		const thetaStep = steps.decStep as number; // Dec step (deg)

		this._phiStep = phiStep;
		this._phiStepRad = degToRad(phiStep);
		this._thetaStep = thetaStep;
		this._thetaStepRad = degToRad(thetaStep);

		this._ra4Labels = new Map();
		this._dec4Labels = new Map();
		this._phiArray = [];
		this._thetaArray = [];

		// Lines of constant Dec (varying RA): for each Dec, a ring with vertices every phiStep°
		for (let theta = thetaStep; theta < 180; theta += thetaStep) {
			const phiVertexPosition = new Float32Array((360 / phiStep) * 3);

			const thetaRad = degToRad(theta);
			for (let phi = 0; phi < 360; phi += phiStep) {
				const phiRad = degToRad(phi);
				const x = R * Math.sin(thetaRad) * Math.cos(phiRad);
				const y = R * Math.sin(thetaRad) * Math.sin(phiRad);
				const z = R * Math.cos(thetaRad);

				const idx = Math.floor(phi / phiStep);
				phiVertexPosition[3 * idx + 0] = x;
				phiVertexPosition[3 * idx + 1] = y;
				phiVertexPosition[3 * idx + 2] = z;

				if (!this._dec4Labels.has(phi)) this._dec4Labels.set(phi, []);
				this._dec4Labels.get(phi)!.push([x, y, z]);
			}

			this._phiArray.push(phiVertexPosition);
		}

		// Lines of constant RA (varying Dec): for each RA, a ring with vertices every thetaStep°
		for (let phi = 0; phi < 360; phi += phiStep) {
			const thetaVertexPosition = new Float32Array((360 / thetaStep) * 3);

			const phiRad = degToRad(phi);
			for (let theta = 0; theta < 360; theta += thetaStep) {
				const thetaRad = degToRad(theta);
				const x = R * Math.sin(thetaRad) * Math.cos(phiRad);
				const y = R * Math.sin(thetaRad) * Math.sin(phiRad);
				const z = R * Math.cos(thetaRad);

				const idx = Math.floor(theta / thetaStep);
				thetaVertexPosition[3 * idx + 0] = x;
				thetaVertexPosition[3 * idx + 1] = y;
				thetaVertexPosition[3 * idx + 2] = z;

				const decKey = 90 - theta; // original code’s keying for RA labels
				if (!this._ra4Labels.has(decKey)) this._ra4Labels.set(decKey, []);
				this._ra4Labels.get(decKey)!.push([x, y, z]);
			}

			this._thetaArray.push(thetaVertexPosition);
		}
	}

	/** Update buffers when FoV (in degrees) changes */
	refresh(): void {
		const fovDeg = healpixGridSingleton.getMinFoV()
		if (this._fov !== fovDeg) {
			this._fov = fovDeg;
			this.initBuffers(this._fov);
		}
	}

	private vectorDistance(p1: Point, p2: Point): number {
		const dx = p1.x - p2.x;
		const dy = p1.y - p2.y;
		const dz = p1.z - p2.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	private enableShader(mMatrix: ReadonlyMat4, pMatrix: ReadonlyMat4): void {
		const gl = global.gl as GL;
		gl.useProgram(this._shaderProgram);

		// uMVMatrix = camera * model
		const mvMatrix = mat4.create();
		mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix() as mat4, mMatrix);

		// TODO move locations retrieval elsewhere

		// Uniform locations
		const uMVMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uMVMatrix');
		const uPMatrixLoc = gl.getUniformLocation(this._shaderProgram, 'uPMatrix');
		const uColor = gl.getUniformLocation(this._shaderProgram, 'u_fragcolor');

		// Attribute locations
		this._attribLocations.position = gl.getAttribLocation(this._shaderProgram, 'aCatPosition');

		if (uMVMatrixLoc) gl.uniformMatrix4fv(uMVMatrixLoc, false, mvMatrix as Float32Array);
		if (uPMatrixLoc) gl.uniformMatrix4fv(uPMatrixLoc, false, pMatrix as Float32Array);
		if (uColor) {
			const rgb = colorHex2RGB(this.defaultColor);
			gl.uniform4f(uColor, rgb[0], rgb[1], rgb[2], 1.0);
		}

	}

	isVisible(): boolean {
		return this.showGrid
	}

	toggleShowGrid() {
		this.showGrid = !this.showGrid
	}
	/**
	 * @param mMatrix model matrix associated with current HiPS (or scene) transform
	 * @param fovObj  current field-of-view (degrees). If your FoV type differs,
	 *                pass the numeric value here; this signature matches original usage.
	 */
	draw(): void {

		const gl = global.gl as GL;
		const mMatrix = this.getModelMatrix();
		if (this._thetaArray.length === 0) return;

		this.refresh();

		if (!this.showGrid) {
			// gridTextHelper.resetDivSets();
			this.gridText.resetDivSets();
			return;
		}

		const pMatrix = computePerspectiveMatrixSingleton.pMatrix as ReadonlyMat4;
		this.enableShader(mMatrix, pMatrix);

		// Draw Dec rings
		for (let i = 0; i < this._phiArray.length; i++) {
			(global.gl as GL).bindBuffer((global.gl as GL).ARRAY_BUFFER, this._phiVertexPositionBuffer);
			(global.gl as GL).bufferData((global.gl as GL).ARRAY_BUFFER, this._phiArray[i], (global.gl as GL).STATIC_DRAW);
			(global.gl as GL).vertexAttribPointer(this._attribLocations.position, 3, (global.gl as GL).FLOAT, false, 0, 0);
			(global.gl as GL).enableVertexAttribArray(this._attribLocations.position);

			(global.gl as GL).drawArrays((global.gl as GL).LINE_LOOP, 0, 360 / this._phiStep);
		}

		// Draw RA rings
		for (let j = 0; j < this._thetaArray.length; j++) {
			(global.gl as GL).bindBuffer((global.gl as GL).ARRAY_BUFFER, this._thetaVertexPositionBuffer);
			(global.gl as GL).bufferData((global.gl as GL).ARRAY_BUFFER, this._thetaArray[j], (global.gl as GL).STATIC_DRAW);
			(global.gl as GL).vertexAttribPointer(this._attribLocations.position, 3, (global.gl as GL).FLOAT, false, 0, 0);
			(global.gl as GL).enableVertexAttribArray(this._attribLocations.position);

			(global.gl as GL).drawArrays((global.gl as GL).LINE_LOOP, 0, 360 / this._thetaStep);
		}

		// Label layout (HTML overlay)
		const center = FoVUtils.getCenterJ2000(gl.canvas as HTMLCanvasElement);
		// MVP = P * V * M
		const mvMatrix = mat4.create();
		mat4.multiply(mvMatrix, (global.camera as any).getCameraMatrix() as unknown as mat4, mMatrix);
		const mvpMatrix = mat4.create();
		mat4.multiply(mvpMatrix, pMatrix as unknown as mat4, mvMatrix);

		// Dec labels (loop over RA keys)
		for (const [raDegKey, points] of this._dec4Labels.entries()) {
			if (Math.abs(raDegKey - center.raDeg) <= this._phiStep) {
				for (let p = 0; p < points.length; p++) {
					const [x, y, z] = points[p];
					const phiPoint: [number, number, number, number] = [x, y, z, 1];
					const point = new Point({ x, y, z }, CoordsType.CARTESIAN);
					const decDeg = point.decDeg;

					if (Math.abs(decDeg - center.decDeg) < 60) {
						const clipspace = vec4.create();
						vec4.transformMat4(clipspace, phiPoint, mvpMatrix);

						// perspective divide
						clipspace[0] /= clipspace[3];
						clipspace[1] /= clipspace[3];

						// clip->pixel
						const pixelX = (clipspace[0] * 0.5 + 0.5) * (global.gl as GL).canvas.width;
						const pixelY = (clipspace[1] * -0.5 + 0.5) * (global.gl as GL).canvas.height;
						this.gridText.addEqDivSet(decDeg.toFixed(2), pixelX, pixelY, 'dec');
						// gridTextHelper.addEqDivSet(decDeg.toFixed(2), pixelX, pixelY, 'dec');
					}
				}
			}
		}

		// RA labels (loop over Dec keys)
		for (const [decDegKey, points] of this._ra4Labels.entries()) {
			if (Math.abs(decDegKey - center.decDeg) <= this._thetaStep) {
				for (let p = 0; p < points.length; p++) {
					const [x, y, z] = points[p];
					const phiPoint: [number, number, number, number] = [x, y, z, 1];
					const point = new Point({ x, y, z }, CoordsType.CARTESIAN);
					const d = this.vectorDistance(point, center);

					const raDeg = point.raDeg;
					if (d < degToRad(50)) {
						const clipspace = vec4.create();
						vec4.transformMat4(clipspace, phiPoint, mvpMatrix);

						clipspace[0] /= clipspace[3];
						clipspace[1] /= clipspace[3];

						const pixelX = (clipspace[0] * 0.5 + 0.5) * (global.gl as GL).canvas.width;
						const pixelY = (clipspace[1] * -0.5 + 0.5) * (global.gl as GL).canvas.height;

						// gridTextHelper.addEqDivSet(raDeg.toFixed(2), pixelX, pixelY, 'ra');
						this.gridText.addEqDivSet(raDeg.toFixed(2), pixelX, pixelY, 'ra');
					}
				}
			}
		}

		this.gridText.resetDivSets();
		// gridTextHelper.resetDivSets();

		// Cleanup
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	}
}

const equatorialGridSingleton = new EquatorialGrid();
export default equatorialGridSingleton;