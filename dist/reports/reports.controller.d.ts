export declare class ReportsController {
    checkpointEntries(name?: string, start?: string, end?: string, page?: string, pageSize?: string): {
        data: {
            id: string;
            sn: number;
            name: string;
            vehicleNumber: string;
            entryDate: string;
            status: import("../store/data").QueueStatus;
            weight: number | null;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    };
    detailEntries(start?: string, end?: string, vehicleNo?: string, goods?: string, billNo?: string, page?: string, pageSize?: string): {
        data: {
            id: any;
            dateTime: any;
            receiptNo: any;
            vehicleNo: string;
            vehicleType: string;
            checkpoint: string;
            route: string;
            grossWeight: any;
            material: string;
            remarks: any;
            billNo: any;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    };
}
