import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, IGetUserAuthInfoRequest } from "../secrets";
import { prismaClient } from "..";

//supports both cookkie and and header
// Client should make a request to /api/v1/users/refresh-token if they have refreshToken present in their cookie
// Then they will get a new access token which will allow them to refresh the access token without logging out the user
export const verifyJWT = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    try {
      const decodedtoken = jwt.verify(token, ACCESS_TOKEN_SECRET);
      const user = await prismaClient.user.findUnique({
        where: {
          id: (decodedtoken as JwtPayload)._id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          loginType: true,
        },
      });
      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid access token");
    }
  }
);
