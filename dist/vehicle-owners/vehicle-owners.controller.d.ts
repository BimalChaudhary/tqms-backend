type OwnerFiles = Record<string, {
    originalname: string;
}[]>;
export declare class VehicleOwnersController {
    list(page?: string, pageSize?: string, q?: string, verified?: string): {
        data: {
            id: string;
            name: string;
            email: string | null;
            address: string;
            phone: string;
            linkedOwner: string | null;
            isAssigned: boolean;
            isVerified: boolean;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    };
    get(id: string): {
        id: string;
        name: string;
        email: string | null;
        phone: string;
        linkedOwner: string | null;
        isAssigned: boolean;
        isVerified: boolean;
        form: Record<string, any>;
        province: string;
        district: string;
        address: string;
        files: Record<string, string>;
    };
    create(body: any, uploads?: OwnerFiles): {
        id: string;
        name: any;
        email: any;
        address: any;
        phone: any;
        linkedOwner: null;
        isAssigned: boolean;
        isVerified: boolean;
    };
    update(id: string, body: any, uploads?: OwnerFiles): {
        id: string;
        name: string;
        email: string | null;
        address: string;
        phone: string;
        linkedOwner: string | null;
        isAssigned: boolean;
        isVerified: boolean;
    };
    banks(id: string): any[];
    addBank(id: string, body: any, chequePhoto?: {
        mimetype: string;
        buffer: Buffer;
    }): {
        id: string;
        bankId: any;
        bank: string;
        branch: any;
        accountHolder: any;
        accountNumber: any;
        chequeUrl: string | null;
        isCurrent: boolean;
    };
    updateBank(id: string, bankId: string, body: any, chequePhoto?: {
        mimetype: string;
        buffer: Buffer;
    }): any;
    vehicles(id: string): {
        id: string;
        vehicleId: string;
        name: string;
        type: string;
        plateNo: string;
    }[];
}
export {};
