/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3, mat4 } from "gl-matrix";
import global from "../Global.js";
import { HiPSShaderProgram } from '../shader/HiPSShaderProgram.js';
export class AbstractSkyEntity {
    // Public-ish properties used elsewhere in the app
    refreshMe = false;
    fovX_deg = 180;
    fovY_deg = 180;
    xRad;
    yRad;
    prevFoV = this.fovX_deg;
    name;
    // public insideSphere: boolean = bootSetup.insideSphere
    // Picking/sphere
    center;
    radius;
    isGalacticHips;
    // GL resources
    vertexTextureCoordBuffer = null;
    vertexPositionBuffer = null;
    vertexIndexBuffer = null;
    shaderProgram = null;
    // Matrices
    T = mat4.create();
    R = mat4.create();
    modelMatrix = mat4.create();
    inverseModelMatrix = mat4.create();
    // Precomputed transform from galactic to equatorial (already inverted)
    galacticMatrixInverted = mat4.create();
    _webgl;
    _hipsShaderProgram;
    // protected _visibleTilesManager: VisibleTilesManager
    // protected _tileBuffer: TileBuffer
    constructor(in_radius, in_position, in_xRad, in_yRad, in_name, webgl, isGalacticHips) {
        this._webgl = webgl;
        this.xRad = in_xRad;
        this.yRad = in_yRad;
        this.name = in_name;
        this.center = vec3.clone(in_position);
        this.radius = in_radius;
        // this.insideSphere = global.insideSphere
        this.isGalacticHips = !!isGalacticHips;
        // Fill the matrix via Float32Array.set (safer than mat4.set with 16 scalars)
        mat4.set(this.galacticMatrixInverted, -0.054875582456588745, -0.8734370470046997, -0.48383501172065735, 0, 0.49410945177078247, -0.4448296129703522, 0.7469822764396667, 0, -0.8676661849021912, -0.19807636737823486, 0.4559837877750397, 0, 0, 0, 0, 1);
        // this._tileBuffer = new TileBuffer(1, this._webgl)
        // this._visibleTilesManager = new VisibleTilesManager(this._tileBuffer)
        // this._visibleTilesManager = new VisibleTilesManager()
        this._hipsShaderProgram = new HiPSShaderProgram(this._webgl);
    }
    get hipsShaderProgram() {
        return this._hipsShaderProgram;
    }
    // get tileBuffer() {
    //   return this._tileBuffer
    // }
    get webgl() {
        return this._webgl;
    }
    /** GL setup and initial model transform */
    initGL(gl) {
        // GL resources
        this.vertexTextureCoordBuffer = gl.createBuffer();
        this.vertexPositionBuffer = gl.createBuffer();
        this.vertexIndexBuffer = gl.createBuffer();
        this.shaderProgram = gl.createProgram();
        // Reset object transforms
        this.T = mat4.create();
        this.R = mat4.create();
        this.modelMatrix = mat4.create();
        this.inverseModelMatrix = mat4.create();
        // Initial pose
        this.translate(this.center);
        this.rotate(this.xRad, this.yRad);
    }
    translate(translation) {
        mat4.translate(this.T, this.T, translation);
        this.refreshModelMatrix();
    }
    rotate(rad1, rad2) {
        mat4.rotate(this.R, this.R, rad2, [0, 0, 1]);
        mat4.rotate(this.R, this.R, rad1, [1, 0, 0]);
        this.refreshModelMatrix();
    }
    rotateFromZero(rad1, rad2) {
        mat4.identity(this.R);
        mat4.rotate(this.R, this.R, rad1, [1, 0, 0]);
        mat4.rotate(this.R, this.R, rad2, [0, 0, 1]);
        this.refreshModelMatrix();
    }
    refreshModelMatrix() {
        const R_inverse = mat4.create();
        mat4.invert(R_inverse, this.R);
        mat4.multiply(this.modelMatrix, this.T, R_inverse);
        // Flip Y if we're outside the sphere
        if (!global.insideSphere) {
            this.modelMatrix[1] = -this.modelMatrix[1];
            this.modelMatrix[5] = -this.modelMatrix[5];
            this.modelMatrix[9] = -this.modelMatrix[9];
            this.modelMatrix[13] = -this.modelMatrix[13];
        }
        // Apply galactic frame transform if needed
        if (this.isGalacticHips) {
            mat4.multiply(this.modelMatrix, this.modelMatrix, this.galacticMatrixInverted);
        }
    }
    getModelMatrixInverse() {
        mat4.identity(this.inverseModelMatrix);
        mat4.invert(this.inverseModelMatrix, this.modelMatrix);
        return this.inverseModelMatrix;
    }
    getModelMatrix() {
        return this.modelMatrix;
    }
    /** Children with hierarchical geometry (e.g., HiPS) can override this. */
    setGeometryNeedsToBeRefreshed() {
        this.refreshGeometryOnFoVChanged = false;
    }
    // Helpers operating on raw mat4 buffers (kept from your JS)
    rotateX(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv1 = m[1], mv5 = m[5], mv9 = m[9];
        m[1] = m[1] * c - m[2] * s;
        m[5] = m[5] * c - m[6] * s;
        m[9] = m[9] * c - m[10] * s;
        m[2] = m[2] * c + mv1 * s;
        m[6] = m[6] * c + mv5 * s;
        m[10] = m[10] * c + mv9 * s;
        return m;
    }
    rotateY(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const mv0 = m[0], mv4 = m[4], mv8 = m[8];
        m[0] = c * m[0] + s * m[2];
        m[4] = c * m[4] + s * m[6];
        m[8] = c * m[8] + s * m[10];
        m[2] = c * m[2] - s * mv0;
        m[6] = c * m[6] - s * mv4;
        m[10] = c * m[10] - s * mv8;
        return m;
    }
}
//# sourceMappingURL=AbstractSkyEntity.js.map