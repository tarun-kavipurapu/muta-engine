import bcrypt from "bcrypt";
import { ApiError } from "./ApiError";
import { StatusCodes } from "http-status-codes";
import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
} from "../secrets";

export const hashPassword = async (password: string) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);
    return hashedPass;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to hash password"
    );
  }
};

export const comparePassword = async (
  originalPassword: string,
  hashedPassword: string
) => {
  try {
    const isSame = await bcrypt.compare(originalPassword, hashedPassword);

    return isSame;
  } catch (error) {
    console.error("Error Comparing Password");
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to compare Pasword"
    );
  }
};

export const generateAccessToken = (user: User) => {
  try {
    const token = jwt.sign(
      {
        _id: user.id,
        email: user.email,
        username: user.name,
      },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      }
    );
    return token;
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to Generate Access Token"
    );
  }
};
export const generateRefreshToken = (user: User) => {
  try {
    const token = jwt.sign(
      {
        _id: user.id,
        email: user.email,
        username: user.name,
      },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRY,
      }
    );
    return token;
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to Generate Access Token"
    );
  }
};