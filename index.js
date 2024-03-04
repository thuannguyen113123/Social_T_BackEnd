import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoute.js";
import postRoutes from "./routes/postRoute.js";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// Cấu hình env(môi trường)
dotenv.config();

const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Kết nối cơ sở dữ liệu
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});
app.use("/api/v1/user", userRoutes);
// bài viết
app.use("/api/v1/post", postRoutes);

// Port
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server chạy trên port ${PORT}`);
});

global.onlinUsers = new Map();
io.on("connection", (socket) => {
  global.chatsocket = socket;

  socket.on("addUser", (id) => {
    global.onlinUsers.set(id, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = global.onlinUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.message);
    }
  });
});
