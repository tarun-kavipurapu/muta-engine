import express from "express";

import { PORT } from "./secrets";
import { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import morganMiddleware from "./logger/morgon.logger";
import logger from "./logger/winston.logger";
import { errorHandler } from "./middlewares/errors.middleware";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(morganMiddleware);

export const prismaClient = new PrismaClient({ log: ["query"] });

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
