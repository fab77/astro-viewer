/**
 * @author Fabrizio Giordano (Fab)
 */
import { vec3, mat4, ReadonlyVec3, ReadonlyMat4 } from "gl-matrix";
type GL = WebGLRenderingContext | WebGL2RenderingContext;
declare abstract class AbstractSkyEntity {
    refreshMe: boolean;
    fovX_deg: number;
    fovY_deg: number;
    xRad: number;
    yRad: number;
    prevFoV: number;
    name: string;
    center: vec3;
    radius: number;
    isGalacticHips: boolean;
    protected vertexTextureCoordBuffer: WebGLBuffer | null;
    protected vertexPositionBuffer: WebGLBuffer | null;
    protected vertexIndexBuffer: WebGLBuffer | null;
    protected shaderProgram: WebGLProgram | null;
    protected T: mat4;
    protected R: mat4;
    protected modelMatrix: mat4;
    protected inverseModelMatrix: mat4;
    protected galacticMatrixInverted: mat4;
    constructor(in_radius: number, in_position: ReadonlyVec3, in_xRad: number, in_yRad: number, in_name: string, isGalacticHips?: boolean);
    /** GL setup and initial model transform */
    initGL(gl: GL): void;
    translate(translation: ReadonlyVec3): void;
    rotate(rad1: number, rad2: number): void;
    rotateFromZero(rad1: number, rad2: number): void;
    protected refreshModelMatrix(): void;
    getModelMatrixInverse(): ReadonlyMat4;
    getModelMatrix(): ReadonlyMat4;
    /** Children with hierarchical geometry (e.g., HiPS) can override this. */
    setGeometryNeedsToBeRefreshed(): void;
    rotateX(m: mat4, angle: number): mat4;
    rotateY(m: mat4, angle: number): mat4;
    abstract draw(): void;
}
export default AbstractSkyEntity;
//# sourceMappingURL=AbstractSkyEntity.d.ts.map