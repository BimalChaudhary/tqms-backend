export declare class CheckpointUsersController {
    list(page?: string, pageSize?: string, q?: string): {
        data: import("../store/data").CheckpointUser[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    };
    get(id: string): import("../store/data").CheckpointUser;
    create(body: any): {
        id: string;
        name: any;
        address: any;
        contact: any;
        email: any;
        provinceId: any;
        districtId: any;
        isActive: any;
    };
    update(id: string, body: any): import("../store/data").CheckpointUser;
    setStatus(id: string, body: {
        isActive: boolean;
    }): import("../store/data").CheckpointUser;
    remove(id: string): undefined;
}
