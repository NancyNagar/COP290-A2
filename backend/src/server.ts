import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import boardRoutes from "./routes/boardRoutes";
import taskRoutes from "./routes/taskRoutes";
import commentRoutes from "./routes/commentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
/*endpoints becomes 
      POST/api/projects
      GET/api/projetcs
      PUT/projects/:id
      DELETE/projects/:id
*/
app.use("/api/projects", projectRoutes);
/**endpoints for boards are
 * POST/API/boards
 * get/api/boards/:projectId 
 * */
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
if (process.env.NODE_ENV !== "test") {
  app.listen(5000, () => {
    console.log("Server running");
  });
}
export default app;