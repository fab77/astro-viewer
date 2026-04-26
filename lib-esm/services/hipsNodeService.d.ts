import { HiPSDescriptor } from '../model/hips/HiPSDescriptor.js';
import type { HiPSItem } from './types.js';
export declare function getHiPSNodeListFile(): Promise<unknown[]>;
export declare function getHiPSDescriptor(hipsUrl: string): Promise<HiPSDescriptor | null>;
export declare function addHiPSNode(hipsNodeUrl: string): Promise<HiPSItem[]>;
export declare function addHiPS(hipsUrl: string): Promise<HiPSDescriptor | null>;
