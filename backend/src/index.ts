import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDatabase from "./config/database.config";
import { initSocketIO, getIO } from "./config/socket.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";
import { notificationService } from "./services/notification.service";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import notificationRoutes from "./routes/notification.route";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec, SWAGGER_UI_PATH } from "./config/swagger.config";

const app = express();
const BASE_PATH = process.env.BASE_PATH ?? "/api";
const PORT = Number(process.env.PORT ?? "8000");
const NODE_ENV = process.env.NODE_ENV ?? "development";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(passport.initialize());

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(SWAGGER_UI_PATH, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get(
  `/`,
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException(
      "This is a bad request",
      ErrorCodeEnum.AUTH_INVALID_TOKEN
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Welcome to Team Flow API",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/notifications`, isAuthenticated, notificationRoutes);

app.use(errorHandler);

const httpServer = createServer(app);
const io = initSocketIO(httpServer);
notificationService.init(io);

export { io, getIO };

httpServer.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT} in ${NODE_ENV}`);
  console.log(`Swagger API docs: http://localhost:${PORT}${SWAGGER_UI_PATH}`);
  await connectDatabase();
});
