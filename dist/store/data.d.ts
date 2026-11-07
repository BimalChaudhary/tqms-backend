export type QueueStatus = "in_job" | "in_queue" | "unregistered" | "payment_pending";
export interface CheckpointProfile {
    id: string;
    name: string;
    sthaniyaSangh: string;
    email: string;
    passwordHash: string;
    checkpointType: string;
    province: string;
    district: string;
    region: string;
    geoLocation: string | null;
    status: "active" | "inactive";
}
export interface CheckpointUser {
    id: string;
    name: string;
    address: string | null;
    contact: string;
    email: string;
    provinceId: string;
    districtId: string;
    isActive: boolean;
}
export interface Vehicle {
    id: string;
    plateNo: string;
    lotNo: string | null;
    vehicleNumber: string;
    vehicleTypeId: string;
    vehicleType: string;
    sanghId: string;
    sanghName: string | null;
    ownerId: string;
    ownerName: string | null;
    mobile: string | null;
    email: string | null;
    form: Record<string, any>;
    general: Record<string, any>;
    tareWeight: number;
    sub: Record<string, any[]>;
    auditLogs: {
        id: string;
        at: string;
        user: string;
        action: string;
        detail: string;
    }[];
}
export interface VehicleOwner {
    id: string;
    name: string;
    email: string | null;
    address: string;
    phone: string;
    linkedOwner: string | null;
    isAssigned: boolean;
    isVerified: boolean;
    form: Record<string, any>;
    province: string;
    district: string;
    files: Record<string, string>;
    banks: any[];
}
export interface OtherVehicle {
    id: string;
    kind: "indian" | "unregistered";
    vehicleNumber: string;
    vehicleTypeId: string;
    vehicleType: string;
    plateTypeId?: string;
}
export interface Queue {
    id: string;
    queueNumber: string;
    vehicleNumber: string;
    vehicleId?: string;
    vehicleType: string;
    cardType: string | null;
    cardNumber: string | null;
    lastCheckpoint: string | null;
    status: QueueStatus;
    owner: string | null;
    isRegistered: boolean;
    sangh: string | null;
    route: string | null;
    transportCompany: string | null;
    loadDetails: string | null;
    checkpointWeight: number | null;
    entryDate: string;
    entries: any[];
    from: string;
    to: string;
    kind: string;
}
export interface PendingQueue {
    id: string;
    vehicleNumber: string;
    route: string;
    entryDate: string;
    material: string | null;
    remarks: string | null;
    driverPhone: string | null;
}
export declare const LOOKUPS: Record<string, {
    value: string;
    label: string;
}[]>;
export declare function getDistricts(parentId?: string): {
    value: string;
    label: string;
}[];
export declare const db: {
    sessions: Map<string, string>;
    users: CheckpointProfile[];
    checkpointUsers: CheckpointUser[];
    narration: string;
    vehicleOwners: VehicleOwner[];
    vehicles: Vehicle[];
    otherVehicles: OtherVehicle[];
    queues: Queue[];
    pendingQueues: PendingQueue[];
};
export declare function paginate<T>(items: T[], page?: number, pageSize?: number): {
    data: T[];
    meta: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
};
export declare function newId(): string;
