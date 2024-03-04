import express from "express";
// import { getSingleFollowingController } from "../controllers/userController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  commentController,
  createPostController,
  deletePostController,
  dislikeController,
  getAFollowersControler,
  getAFollowingControler,
  getSinglePostController,
  likeController,
  updatePostController,
  createMessageController,
  getMessageController,
  deleteCommentController,
} from "./../controllers/postController.js";

const router = express.Router();
//Tạo bài viết
router.post("/user/post", requireSignIn, createPostController);

//Lây bài chi tiết bài post bởi người dùng
router.get("/get-post/:id", getSinglePostController);
//Cập nhật bài viết
router.put("/update-post/:id", requireSignIn, updatePostController);
//Like
router.put("/:id/like", requireSignIn, likeController);
//disLike
router.put("/:id/dislike", requireSignIn, dislikeController);
//Bình luận
router.put("/comment/post", requireSignIn, commentController);
//Xóa bình luận
router.delete(
  "/comment/delete/:postId/:commentId",
  requireSignIn,
  deleteCommentController
);
//Xóa bài viết
router.delete("/delete-post/:id", requireSignIn, deletePostController);
//Lấy người dung đang follow mình
router.get("/following/:id", getAFollowingControler);
//Lấy người dùng mình follow
router.get("/followers/:id", getAFollowersControler);
//Tạo tin nhắn
router.post("/msg", requireSignIn, createMessageController);
router.get(
  "/get/chat/msg/:user1Id/:user2Id",
  requireSignIn,
  getMessageController
);

export default router;
