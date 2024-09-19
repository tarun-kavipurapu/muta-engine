import { Request, Response, NextFunction } from "express";
import { prismaClient } from "..";
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
} from "../utils/JWT";
import { ApiError } from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { REFRESH_TOKEN_EXPIRY } from "../secrets";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

const generateAcessandRefreshToken = async (userId: number) => {
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const expiresInDays = parseInt(REFRESH_TOKEN_EXPIRY || "0");
      const expiresAt = new Date(
        Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      );

      const refreshTokenCreateObject = await prismaClient.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: expiresAt,
        },
      });
      return { accessToken, refreshTokenCreateObject };
    } else {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "User not found");
    }
  } catch (error) {
    console.error(error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error Creating Access and RefreshToken"
    );
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  //hash the password

  //generate the token

  //return the acess and refreshToken

  res.send("Everything gucci");
};

//here error Handling is ALready Taken Care by asyncHandler
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  const existedUser = await prismaClient.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists", []);
  }

  const hashedPassword = await hashPassword(password);
  console.log(username);
  const user = await prismaClient.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: username,
    },
    select: {
      id: true,
      email: true,
      name: true,
      googleId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(200, { user: user }, "Users registered successfully .")
    );
});
