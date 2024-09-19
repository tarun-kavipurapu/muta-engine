import { Request, Response, NextFunction } from "express";
import { ZodError, ZodIssue } from "zod";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/ApiError"; // Adjust the import path

const Validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next(); // If validation succeeds, move to the next middleware
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: ZodIssue) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));

        // Instead of throwing, pass the error to the next middleware
        next(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            "Invalid data",
            errorMessages as any
          )
        );
      } else {
        next(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Internal Server Error"
          )
        );
      }
    }
  };
};

export default Validate;
