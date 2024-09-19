import { Request, Response, NextFunction } from "express";
import { prismaClient } from "..";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
} from "../utils/JWT";
import { ApiError } from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import {
  AvailableSocialLogins,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRY,
} from "../secrets";
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
      return { accessToken, refreshToken };
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

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  //find user by email
  const user = await prismaClient.user.findUnique({
    where: {
      email: email,
    },
  });

  //if usernot found send the error simply
  if (user == null) {
    throw new ApiError(409, "User with this Email Does not Exist", []);
  }
  if (user.loginType !== AvailableSocialLogins.EMAIL_PASSWORD) {
    // If user is registered with some other method, we will ask him/her to use the same method as registered.
    // This shows that if user is registered with methods other than email password, he/she will not be able to login with password. Which makes password field redundant for the SSO
    throw new ApiError(
      400,
      "You have previously registered using " +
        user.loginType?.toLowerCase() +
        ". Please use the " +
        user.loginType?.toLowerCase() +
        " login option to access your account."
    );
  }

  if (!user.password) {
    throw new ApiError(
      409,
      "User Does not Have a password Maybe an Google Signin User",
      []
    );
  }

  const isSame = await comparePassword(password, user.password);

  if (isSame == false) {
    throw new ApiError(409, "The password/email you have entered is wrong", []);
  }
  //generate the refresh and acess token and just send the response and set the cookie
  const { accessToken, refreshToken } = await generateAcessandRefreshToken(
    user.id
  );

  const userSend = await prismaClient.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      email: true,
      loginType: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  // TODO: Add more options to make cookie more secure and reliable
  const options = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    // sameSite: "Strict", // Controls cross-site request behavior
    // maxAge: 24 * 60 * 60 * 1000, // Sets cookie expiration (in milliseconds)
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: userSend, accessToken, refreshToken },
        "Users registered successfully ."
      )
    );
});

//here error Handling is Already Taken Care by asyncHandler
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
  const user = await prismaClient.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: username,
      loginType: AvailableSocialLogins.EMAIL_PASSWORD,
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

  return res
    .status(201)
    .json(
      new ApiResponse(200, { user: user }, "Users registered successfully .")
    );
});
