export declare class OtherVehiclesController {
    list(page?: string, pageSize?: string, kind?: string, q?: string): {
        data: {
            formattedNo: string;
            plateType: string | null;
            vehicleType: string;
            id: string;
            kind: "indian" | "unregistered";
            vehicleNumber: string;
            vehicleTypeId: string;
            plateTypeId?: string;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    };
    create(body: any): {
        formattedNo: any;
        plateType: string | null;
        id: string;
        kind: any;
        vehicleNumber: any;
        vehicleTypeId: any;
        vehicleType: string;
        plateTypeId: any;
    };
}
