import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import { errorHandler, notFound } from "./middleware/error";
import { setupSwagger } from "./config/swagger";
import articleRoutes from "./routes/article.routes";
import { deleteArticleCron, scheduledPostCron } from "./libs/cron";

const allowedOrigins = [
  "http://localhost:5173",
  "https://newsroom-fe-smoky.vercel.app",
  "http://localhost:5000",
];

export const createApp = () => {
  const app = express();
  app.use(helmet());
  // app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  setupSwagger(app);

  app.use("/api/auth", authRoutes);
  app.use("/api", protectedRoutes);
  app.use("/api/articles", articleRoutes);
  scheduledPostCron();
  deleteArticleCron()
  app.use(notFound);
  app.use(errorHandler);
  return app;
};
