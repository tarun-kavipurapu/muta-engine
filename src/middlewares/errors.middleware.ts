import { Prisma } from "@prisma/client";
import logger from "../logger/winston.logger";
import { ApiError } from "../utils/ApiError";
import { NODE_ENV } from "../secrets";
import { Request, Response, NextFunction } from "express";

const errorHandler = (
  err: ApiError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error: ApiError;

  // Check if it's an ApiError (user-defined error)
  if (err instanceof ApiError) {
    error = err;
  } else {
    // Prisma Error Handling
    if (
      err instanceof Prisma.PrismaClientKnownRequestError ||
      err instanceof Prisma.PrismaClientUnknownRequestError ||
      err instanceof Prisma.PrismaClientRustPanicError ||
      err instanceof Prisma.PrismaClientInitializationError ||
      err instanceof Prisma.PrismaClientValidationError
    ) {
      // Create a more readable message for Prisma errors
      let message = "Database Error";
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        message = `Prisma Error: ${err.message}`;
        if (err.code === "P2002") {
          message =
            "There is a unique constraint violation, a new user cannot be created with this email.";
        }
      }

      // Assign a Prisma-specific error code and message
      error = new ApiError(400, message, []);
    } else {
      // If it's not a Prisma error, handle it as a generic server error
      const message = err.message || "Something went wrong";
      error = new ApiError(500, message, [], err.stack);
    }
  }

  // Create the error response object
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(NODE_ENV === "development" ? { stack: error.stack } : {}), // Include stack trace only in development
  };

  // Log the error message
  logger.error(`${error.message}`);

  // Send the formatted error response
  res.status(error.statusCode).json(response);
};

export { errorHandler };
