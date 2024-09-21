import { Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prismaClient } from "../index";
import { IGetUserAuthInfoRequest } from "../secrets";
import requestIp from "request-ip";

export const trackAPIUsage = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    try {
      const clientIp = requestIp.getClientIp(req);

      const method = req.method;
      const endpoint = req.originalUrl;
      const ipAddress = req.ip;
      const userId = req.user?.id || null;

      await prismaClient.apiUsageLog.create({
        data: {
          method,
          endpoint,
          ipAddress: ipAddress as string,
          userId,
        },
      });

      next();
    } catch (error) {
      console.error("Error logging API usage", error);
      next(); // Continue to the next middleware even if logging fails
    }
  }
);
