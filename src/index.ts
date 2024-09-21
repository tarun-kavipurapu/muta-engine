import express, { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

import { CORS_ORIGIN, EXPRESS_SESSION_SECRET, PORT } from "./secrets";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import morganMiddleware from "./logger/morgon.logger";
import { errorHandler } from "./middlewares/errors.middleware";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { passportInitialize } from "./passport";
import requestIp from "request-ip";
import { trackAPIUsage } from "./middlewares/apitracker.middleware";
import { seeder } from "./utils/seeder";
import { ApiError } from "./utils/ApiError";

const app = express();

export const prismaClient = new PrismaClient();
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(morganMiddleware);

// required for passport
app.use(
  cors({
    origin: "http://localhost:5173 ",
    credentials: true,
  })
);
app.use(requestIp.mw());
app.use(trackAPIUsage);

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10000,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: any, res: any) => {
    return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
  },
  handler: (_: any, __: any, ___: any, options: any) => {
    throw new ApiError(
      options.statusCode || 500,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

app.use(limiter);

app.use(
  session({
    secret: EXPRESS_SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
passportInitialize(passport);

//routes
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import orderRoutes from "./routes/order.routes";
import cartRoutes from "./routes/cart.router";
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/cart", cartRoutes);

////////////////////////////////////////////////////
// seeder
app.get("/seed", (req: Request, res: Response) => {
  seeder()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });

  res.send("Seed Sucessfull");
});
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

//make sure this is last to avoid circular  dependency
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
