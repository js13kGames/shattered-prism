export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export type Quat = [x: number, y: number, z: number, w: number];
export type Vec2 = [x: number, y: number];
export type Vec3 = [x: number, y: number, z: number];
export type Vec4 = [x: number, y: number, z: number, w: number];
export type Mat4 =
    | Float32Array
    | [
          m00: number,
          m01: number,
          m02: number,
          m03: number,
          m10: number,
          m11: number,
          m12: number,
          m13: number,
          m20: number,
          m21: number,
          m22: number,
          m23: number,
          m30: number,
          n31: number,
          m32: number,
          m33: number,
      ];
