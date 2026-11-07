type DocumentUploads = {
    document?: {
        originalname: string;
        mimetype: string;
        buffer: Buffer;
    }[];
};
export declare class VehiclesController {
    list(page?: string, pageSize?: string, q?: string): {
        data: {
            id: string;
            plateNo: string;
            lotNo: string | null;
            vehicleNumber: string;
            vehicleType: string;
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
        plateNo: string;
        sanghName: string | null;
        mobile: string | null;
        email: string | null;
        general: Record<string, any>;
        form: Record<string, any>;
        labels: {
            sangh: string;
            owner: string;
        };
    };
    create(body: any): {
        id: string;
        plateNo: string;
        lotNo: any;
        vehicleNumber: string;
        vehicleType: string;
    };
    update(id: string, body: any): {
        id: string;
        plateNo: string;
        lotNo: string | null;
        vehicleNumber: string;
        vehicleType: string;
    };
    auditLogs(id: string): {
        id: string;
        at: string;
        user: string;
        action: string;
        detail: string;
    }[];
    getTare(id: string): {
        tareWeight: number;
    };
    setTare(id: string, body: {
        tareWeight: number;
    }): {
        tareWeight: number;
    };
    subList(id: string, resource: string): {
        [x: string]: any;
    }[];
    subCreate(id: string, resource: string, body: any, uploads?: DocumentUploads): {
        [x: string]: any;
    };
    subUpdate(id: string, resource: string, rid: string, body: any, uploads?: DocumentUploads): any;
    subRemove(id: string, resource: string, rid: string): undefined;
}
export {};
