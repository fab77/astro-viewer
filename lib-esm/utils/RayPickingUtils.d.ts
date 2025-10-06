import { vec3, ReadonlyVec3, ReadonlyMat4 } from "gl-matrix";
declare class RayPickingUtils {
    private static lastNearestVisibleObjectIdx;
    /** Get index of the last object found under the mouse (if any). */
    static getNearestVisibleObjectIdx(): number;
    /**
     * Builds a world-space ray from mouse coords.
     * @param mouseX ClientX (page pixels)
     * @param mouseY ClientY (page pixels)
     * @param pMatrix Projection matrix
     * @returns World-space direction (normalized) as a vec3
     */
    static getRayFromMouse(mouseX: number, mouseY: number, pMatrix: ReadonlyMat4): vec3;
    /** a*b (4x4 * vec4) → vec4 (in `out`) */
    private static mat4MultiplyVec4;
    /**
     * Ray–sphere intersection (world space).
     * @returns distance `t` along the ray to the first hit, or `-1` if no hit.
     */
    static raySphere(rayOrigWorld: ReadonlyVec3, rayDirectionWorld: ReadonlyVec3): number;
    /**
     * Compute intersection with a single model (defaults to the Healpix grid).
     * @returns model-space intersection point (vec3) if hit, otherwise empty array; and the picked model.
     */
    static getIntersectionPointWithSingleModel(mouseX: number, mouseY: number): number[];
}
export default RayPickingUtils;
//# sourceMappingURL=RayPickingUtils.d.ts.map