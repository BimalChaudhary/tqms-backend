import { Request, Response } from 'express';
export declare class AuthController {
    login(body: {
        email: string;
        password: string;
        remember?: boolean;
    }, req: Request): {
        id: string;
        name: string;
        sthaniyaSangh: string;
        email: string;
        checkpointType: string;
        province: string;
        district: string;
        region: string;
        geoLocation: string | null;
        status: "active" | "inactive";
    };
    logout(req: Request, res: Response): Promise<void>;
    me(req: any): any;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): undefined;
    forgotPassword(body: {
        email: string;
    }): undefined;
}
