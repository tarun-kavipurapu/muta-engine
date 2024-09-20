import express from "express";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import { CORS_ORIGIN, EXPRESS_SESSION_SECRET, PORT } from "./secrets";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import morganMiddleware from "./logger/morgon.logger";
import { errorHandler } from "./middlewares/errors.middleware";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { passportInitialize } from "./passport";

const app = express();

export const prismaClient = new PrismaClient({ log: ["query"] });
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
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/product", productRoutes);

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

//make sure this is last to avoid circular  dependency
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
