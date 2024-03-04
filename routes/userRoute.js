import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  forgotPasswordController,
  getPostFromUserController,
  getSingleFollowingController,
  getUserDetailController,
  loginController,
  registerController,
  resetPasswordController,
  updateUserController,
  verifyEmailController,
  getAllUserFollowController,
} from "./../controllers/userController.js";

//router
const router = express.Router();
//Đăng ký
router.post("/create-user", registerController);
//Đăng nhập
router.post("/login", loginController);
//Theo dõi
router.put("/following/:id", requireSignIn, getSingleFollowingController);
// Lấy các bài viết của người dùng đã follow
router.get("/follow/:id", requireSignIn, getPostFromUserController);
//Cập nhật thông tin người dùng
router.put("/update-user/:id", requireSignIn, updateUserController);
//Xác thực email
router.post("/verify/email", verifyEmailController);
//Quên mật khẩu
router.post("/forgot-password", forgotPasswordController);
//Cập nhật mật khẩu mới
router.put("/reset-password", resetPasswordController);
//Lấy tất cả bài post của mình
router.get("/post/user-details/:id", getUserDetailController);
//Lấy tất cả người dùng mình follow
router.get("/all-user/:id", getAllUserFollowController);
export default router;
