import { HiPSDescriptor } from '../model/hips/HiPSDescriptor.js';
export interface HiPSItem {
    id: number;
    hipsDescriptor: HiPSDescriptor | null;
    provider: string;
    hips: Record<string, unknown>;
}
export interface HiPSNodeEntry {
    hips_service_url: string;
    hips_release_date?: string;
    creator_did?: string;
}
