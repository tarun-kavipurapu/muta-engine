import dotenv from "dotenv";
import { Request } from "express";

dotenv.config({ path: ".env" });

export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
/////////////////////////////////////////////////////////////////////////////////
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
/////////////////////////////////////////////////////////////////////////////////
export const EXPRESS_SESSION_SECRET = process.env
  .EXPRESS_SESSION_SECRET as string;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL as string;
/////////////////////////////////////////////////////////////////////////////////
export const CORS_ORIGIN = process.env.CORS_ORIGIN as string;

/////////////////////////////////////////////////////////////////////////////////
export const EMAIL = process.env.EMAIL;
export const PASSWORD = process.env.PASSWORD;

export const FORGOT_PASSWORD_REDIRECT_URL =
  process.env.FORGOT_PASSWORD_REDIRECT_URL;

export const USER_TEMPORARY_TOKEN_EXPIRY = 20 * 60 * 1000; // 20 minutes

export const UserLoginType = {
  GOOGLE: "GOOGLE",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

// enums.ts

export enum AvailableSocialLogins {
  GOOGLE = "GOOGLE",
  EMAIL_PASSWORD = "EMAIL_PASSWORD",
}
export interface IGetUserAuthInfoRequest extends Request {
  user: any; //TODO:change this into a better type
}
// export const AvailableSocialLogins = Object.values(UserLoginType);
