import dotenv from "dotenv";
import { Request } from "express";

dotenv.config({ path: ".env" });

export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

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
