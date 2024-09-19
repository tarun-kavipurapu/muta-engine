import morgan from "morgan";
import logger from "./winston.logger";

const stream = {
  // Use the http severity
  write: (message: string) => logger.http(message.trim()),
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(
  ":remote-addr :method :url :status :res[content-length] - :response-time ms - :user-agent",
  {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }
);

export default morganMiddleware;
