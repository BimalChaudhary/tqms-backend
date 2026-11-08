export declare class QueuesController {
    list(page?: string, pageSize?: string, status?: string, vehicleId?: string, cardType?: string, vehicleType?: string, q?: string): {
        data: {
            id: string;
            queueNumber: string;
            vehicleNumber: string;
            vehicleType: string;
            cardType: string | null;
            lastCheckpoint: string | null;
            status: import("../store/data").QueueStatus;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    };
    pending(): {
        id: string;
        vehicleNumber: string;
        route: string;
        entryDate: string;
    }[];
    pendingGet(id: string): import("../store/data").PendingQueue;
    pendingApprove(id: string, body: any): {
        id: string;
        queueNumber: string;
        vehicleNumber: string;
        vehicleId: any;
        vehicleType: string;
        cardType: null;
        cardNumber: null;
        lastCheckpoint: string;
        status: "in_queue";
        owner: string | null;
        isRegistered: boolean;
        sangh: string | null;
        route: string;
        transportCompany: null;
        driverPhone: string | null;
        cutFee: number;
        loadDetails: any;
        checkpointWeight: any;
        entryDate: string;
        from: any;
        to: any;
        kind: string;
        entries: {
            id: string;
            entryDate: string;
            from: any;
            to: any;
            weights: {
                cp1: any;
                cp2: null;
                cp3: null;
            };
            billNo: null;
        }[];
    };
    pendingRemove(id: string): undefined;
    get(id: string): import("../store/data").Queue;
    create(body: any): {
        id: string;
        queueNumber: string;
        vehicleNumber: any;
        vehicleId: any;
        vehicleType: string;
        cardType: null;
        cardNumber: null;
        lastCheckpoint: string;
        status: "in_queue";
        owner: string | null;
        isRegistered: boolean;
        sangh: string | null;
        route: string;
        transportCompany: any;
        driverPhone: any;
        cutFee: number;
        loadDetails: any;
        checkpointWeight: any;
        entryDate: string;
        from: any;
        to: any;
        kind: any;
        entries: {
            id: string;
            entryDate: string;
            from: any;
            to: any;
            weights: {
                cp1: any;
                cp2: null;
                cp3: null;
            };
            billNo: null;
        }[];
    };
    checkIn(id: string, body: {
        grossWeight: number;
    }): import("../store/data").Queue;
    endJourney(id: string): import("../store/data").Queue;
    receipt(id: string): {
        receiptNo: string;
        date: string;
        time: string;
        sangh: string;
        checkpoint: string;
        vehicleNumber: string;
        load: string | null;
        driverPhone: string | null;
        narration: string;
        weight: number | null;
        charges: {
            label: string;
            amount: number;
        }[];
        total: number;
    };
}
