import postModel from "../models/postModel.js";
import userModel from "../models/userModel.js";
import Message from "../models/message.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
// import { mysqlConnection, pgClient } from "../config/db.js";

dotenv.config();

//Tạo bài viết
export const createPostController = async (req, res) => {
  try {
    const { title, image, video } = req.body;

    const newPost = new postModel({
      title,
      image,
      video,
      user: req.user.id,
    });
    const post = await newPost.save();

    res.status(201).send({
      success: true,
      message: "Tạo bài viết thành công",
      post,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Lỗi khi tạo bài viết",
    });
  }
};

// export const createPostController = async (req, res) => {
//   try {
//     const { title, image, video } = req.body;

//     // Lưu bài viết vào cơ sở dữ liệu MySQL
//     const insertPostQuery = `INSERT INTO posts (user_mongo_id, title, image, video) VALUES (?, ?, ?, ?)`;
//     const insertPostValues = [req.user.id.toString(), title, image, video];
//     const result = await mysqlConnection.query(
//       insertPostQuery,
//       insertPostValues
//     );
//     const postId = result.insertId;

//     // Lấy dữ liệu phân tán từ MySQL
//     const selectPostQuery = `SELECT * FROM posts WHERE id = ?`;
//     const selectedPost = await mysqlConnection.query(selectPostQuery, [postId]);

//     // Lưu thông tin bài viết vào MongoDB
//     const newPost = new postModel({
//       title,
//       image,
//       video,
//       user: req.user.id,
//     });
//     const post = await newPost.save();

//     res.status(201).json({
//       success: true,
//       message: "Tạo bài viết thành công",
//       post: selectedPost[0],
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       error,
//       message: "Lỗi khi tạo bài viết",
//     });
//   }
// };
//theo dõi sự thay đổi dữ liệu ở moggodb cập nhật qua mysql
// postModel.watch().on("change", async (change) => {
//   if (change.operationType === "insert") {
//     // Thêm dữ liệu vào MySQL từ MongoDB
//     const newPostMySQL = {
//       title: change.fullDocument.title,
//       image: change.fullDocument.image,
//       video: change.fullDocument.video,
//       user_mongo_id: change.fullDocument.user,
//       PostId: change.fullDocument._id,
//     };

//     const sql = "INSERT INTO posts SET ?";
//     mysqlConnection.query(sql, newPostMySQL, (err, result) => {
//       if (err) {
//         console.error("Error synchronizing data to MySQL:", err);
//       } else {
//         console.log("Data synchronized to MySQL:", result);
//       }
//     });
//   } else if (change.operationType === "update") {
//     // Cập nhật dữ liệu trong MySQL từ MongoDB
//     const updatedFields = change.updateDescription.updatedFields;
//     const postId = change.documentKey._id;

//     // Tạo một đối tượng mới chỉ với các trường có giá trị không phải NULL
//     const newPostMySQL = {};
//     if (updatedFields.title !== null) newPostMySQL.title = updatedFields.title;
//     if (updatedFields.image !== null) newPostMySQL.image = updatedFields.image;
//     if (updatedFields.video !== null) newPostMySQL.video = updatedFields.video;
//     if (updatedFields.user !== null)
//       newPostMySQL.user_mongo_id = updatedFields.user;

//     // Thực hiện cập nhật nếu có ít nhất một trường có giá trị không phải NULL
//     if (Object.keys(newPostMySQL).length > 0) {
//       const sql = `UPDATE posts SET ? WHERE id = '${postId}'`;
//       mysqlConnection.query(sql, [newPostMySQL], (err, result) => {
//         if (err) {
//           console.error("Error synchronizing data to MySQL:", err);
//         } else {
//           console.log("Data synchronized to MySQL:", result);
//         }
//       });
//     }
//   } else if (change.operationType === "delete") {
//     // Xóa dữ liệu trong MySQL từ MongoDB
//     const postId = change.documentKey._id;

//     const sql = `DELETE FROM posts WHERE postId = '${postId}'`;
//     mysqlConnection.query(sql, postId, (err, result) => {
//       if (err) {
//         console.error("Error synchronizing data to MySQL:", err);
//       } else {
//         console.log("Data synchronized to MySQL:", result);
//       }
//     });
//   }
// });

postModel.watch().on("change", async (change) => {
  if (change.operationType === "insert") {
    // Thêm dữ liệu vào MySQL từ MongoDB
    const newPostMySQL = {
      title: change.fullDocument.title,
      image: change.fullDocument.image,
      video: change.fullDocument.video,
      user_mongo_id: change.fullDocument.user,
      PostId: change.fullDocument._id,
    };

    const sql = "INSERT INTO posts SET ?";
    mysqlConnection.query(sql, newPostMySQL, (err, result) => {
      if (err) {
        console.error("Lỗi đồng bộ hóa dữ liệu với MySQL:", err);
      } else {
        console.log("Dữ liệu được đồng bộ hóa với MySQL:", result);
      }
    });

    // Thêm dữ liệu vào PostgreSQL từ MongoDB
    const newPostPgSQL = {
      PostId: change.fullDocument._id,
      like: change.fullDocument.like || [],
      dislike: change.fullDocument.dislike || [],
      comments: change.fullDocument.comments || [],
    };

    const sqlInsertPostgreSQL = `
      INSERT INTO posts (PostId, "like", dislike, comments)
      VALUES ($1, $2, $3, $4)
    `;
    const paramsInsertPostgreSQL = [
      newPostPgSQL.PostId,
      newPostPgSQL.like,
      newPostPgSQL.dislike,
      newPostPgSQL.comments,
    ];

    pgClient.query(
      sqlInsertPostgreSQL,
      paramsInsertPostgreSQL,
      (err, result) => {
        if (err) {
          console.error("Lỗi đồng bộ hóa dữ liệu với PostgreSQL:", err);
        } else {
          console.log("Dữ liệu được đồng bộ hóa với PostgreSQL:", result);
        }
      }
    );
  } else if (change.operationType === "update") {
    // Cập nhật dữ liệu trong MySQL từ MongoDB
    const updatedFields = change.updateDescription.updatedFields;
    const postId = change.documentKey._id;

    // Tạo một đối tượng mới chỉ với các trường có giá trị không phải NULL
    const newPostMySQL = {};
    if (updatedFields.title !== null) newPostMySQL.title = updatedFields.title;
    if (updatedFields.image !== null) newPostMySQL.image = updatedFields.image;
    if (updatedFields.video !== null) newPostMySQL.video = updatedFields.video;
    if (updatedFields.user !== null)
      newPostMySQL.user_mongo_id = updatedFields.user;

    // Thực hiện cập nhật nếu có ít nhất một trường có giá trị không phải NULL
    if (Object.keys(newPostMySQL).length > 0) {
      const sql = `UPDATE posts SET ? WHERE id = '${postId}'`;
      mysqlConnection.query(sql, [newPostMySQL], (err, result) => {
        if (err) {
          console.error("Lỗi đồng bộ hóa dữ liệu với PostgreSQL:", err);
        } else {
          console.log("Dữ liệu được đồng bộ hóa với PostgreSQL:", result);
        }
      });
    }

    //Phần postgrest

    // Xử lý các trường like, dislike, comments
    // Trong phần xử lý khi có sự thay đổi (update) trong MongoDB
    // if (updatedFields.like || updatedFields.dislike || updatedFields.comments) {
    //   const newPostPgSQL = {
    //     like: Array.isArray(updatedFields.like) ? updatedFields.like : [],
    //     dislike: Array.isArray(updatedFields.dislike)
    //       ? updatedFields.dislike
    //       : [],
    //     comments: Array.isArray(updatedFields.comments)
    //       ? updatedFields.comments
    //       : [],
    //   };

    //   const updateFields = Object.keys(newPostPgSQL)
    //     .map((key, index) => `"${key}" = COALESCE($${index + 2}, "${key}")`)
    //     .join(", ");

    //   const values = Object.values(newPostPgSQL);

    //   const sqlUpdatePostgreSQL = `UPDATE posts SET ${updateFields} WHERE PostId = $1`;
    //   const paramsUpdatePostgreSQL = [postId, ...values];

    //   pgClient.query(
    //     sqlUpdatePostgreSQL,
    //     paramsUpdatePostgreSQL,
    //     (err, result) => {
    //       if (err) {
    //         console.error("Lỗi đồng bộ hóa dữ liệu với PostgreSQL:", err);
    //       } else {
    //         console.log("Dữ liệu được đồng bộ hóa với PostgreSQL:", result);
    //       }
    //     }
    //   );
    // }
    // Xử lý các trường like, dislike, comments
    // Trong phần xử lý khi có sự thay đổi (update) trong MongoDB
    const { like, dislike, comments } = updatedFields;

    if (like || dislike || comments) {
      const sqlUpdatePostgreSQL = `
      UPDATE posts
      SET
        "like" = COALESCE($1, "like"),
        dislike = COALESCE($2, dislike),
        comments = COALESCE($3, comments)
      WHERE PostId = $4
    `;

      const paramsUpdatePostgreSQL = [like, dislike, comments, postId];

      pgClient.query(
        sqlUpdatePostgreSQL,
        paramsUpdatePostgreSQL,
        (err, result) => {
          if (err) {
            console.error("Lỗi đồng bộ hóa dữ liệu với PostgreSQL:", err);
          } else {
            console.log("Dữ liệu được đồng bộ hóa với PostgreSQL:", result);
          }
        }
      );
    }
  } else if (change.operationType === "delete") {
    // Xóa dữ liệu trong MySQL từ MongoDB
    const postId = change.documentKey._id;

    const sql = `DELETE FROM posts WHERE postId = '${postId}'`;
    mysqlConnection.query(sql, postId, (err, result) => {
      if (err) {
        console.error("Lỗi đồng bộ hóa dữ liệu với MySQL:", err);
      } else {
        console.log("Dữ liệu được đồng bộ hóa với MySQL:", result);
      }
    });

    // Xóa dữ liệu trong PostgreSQL từ MongoDB
    const sqlDeletePostgreSQL = `DELETE FROM posts WHERE PostId = $1`;
    pgClient.query(sqlDeletePostgreSQL, [postId], (err, result) => {
      if (err) {
        console.error("Lỗi đồng bộ hóa dữ liệu với PostgreSQL:", err);
      } else {
        console.log("Dữ liệu được đồng bộ hóa với PostgreSQL:", result);
      }
    });
  }
});

//Lấy thay đổi các trường like dislikes sang postgress ssql
//theo dõi sự thay đổi dữ liệu ở moggodb cập nhật qua mysql

//Lấy bài viết từ người dùng
export const getSinglePostController = async (req, res) => {
  try {
    const myPost = await postModel.find({ user: req.params.id });

    if (!myPost) {
      return res
        .status(200)
        .send({ success: true, message: "Bạn không có bài viết nào" });
    }

    res.status(200).send({
      success: true,
      message: "Đã lấy được viết",
      myPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi trong lúc lấy bài viết",
      error,
    });
  }
};

//Cập nhật bài viết
export const updatePostController = async (req, res) => {
  try {
    let post = await postModel.findById(req.params.id);
    if (!post) {
      return res
        .status(200)
        .send({ success: true, message: "Không tìm thấy bài viết" });
    }
    post = await postModel.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );

    const updatePost = await post.save();

    res.status(200).send({
      success: true,
      message: "Cập nhật thành công bài viết",
      updatePost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi trong lúc cập nhật bài viết",
      error,
    });
  }
};

//xữ like và dislike
export const likeController = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post.like.includes(req.user.id)) {
      if (post.dislike.includes(req.user.id)) {
        await post.updateOne({ $pull: { dislike: req.user.id } });
      }
      await post.updateOne({ $push: { like: req.user.id } });
      return res.status(200).send({
        success: true,
        message: "Bài viết đã được thích",
      });
    } else {
      await post.updateOne({ $pull: { like: req.user.id } });
      return res.status(200).send({
        success: true,
        message: "Bài viết không dc thích",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi trong lúc thích bài viết",
      error,
    });
  }
};
//Dislike
export const dislikeController = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);

    if (!post.dislike.includes(req.user.id)) {
      if (post.like.includes(req.user.id)) {
        await post.updateOne({ $pull: { like: req.user.id } });
      }
      await post.updateOne({ $push: { display: req.user.id } });
      return res.status(200).send({
        success: true,
        message: "Bài viết đã không được thích",
      });
    } else {
      await post.updateOne({ $pull: { dislike: req.user.id } });
      return res.status(200).send({
        success: true,
        message: "Bài đăng đã bị không thích",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi trong lúc dislike bài viết",
      error,
    });
  }
};
//Bình luận
export const commentController = async (req, res) => {
  try {
    const { comment, postid, profile } = req.body;
    const comments = {
      user: req.user.id,
      username: req.user.username,
      comment,
      profile,
    };
    const post = await postModel.findById(postid);
    post.comments.push(comments);
    await post.save();

    res.status(200).send({
      success: true,
      message: "Bình luận thành công",
      post,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error,
    });
  }
};
//Xóa bình luận
export const deleteCommentController = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // Tìm bài đăng theo ID
    const post = await postModel.findById(postId);

    // Kiểm tra xem post có tồn tại không
    if (!post) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy bài đăng",
      });
    }

    // Kiểm tra xem bài đăng có thuộc tính comments không
    if (!post.comments || post.comments.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Bài đăng không có bình luận",
      });
    }

    // Tìm chỉ mục của bình luận trong mảng bình luận của bài đăng
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    // Kiểm tra xem bình luận có tồn tại không
    if (commentIndex === -1) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy bình luận",
      });
    }

    // Loại bỏ bình luận khỏi mảng bình luận
    post.comments.splice(commentIndex, 1);

    // Lưu bài đăng đã được cập nhật
    await post.save();

    res.status(200).send({
      success: true,
      message: "Xóa bình luận thành công",
      post,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error,
    });
  }
};

//Xóa bài viết
export const deletePostController = async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (post.user == req.user.id) {
      const deletePost = await postModel.findByIdAndDelete(req.params.id);
      res.status(200).send({
        success: true,
        message: "Bài đăng của bạn đã bị xóa",
      });
    } else {
      res.status(400).send({
        success: false,
        message: "Bạn không được phép xóa bài viết này",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error,
    });
  }
};

//Lấy từng người dùng đang theo dõi
// export const getAFollowingControler = async (req, res) => {
//   try {
//     const userId = await userModel.findById(req.params.id);
//     const user = await userModel.findById(mongoose.Types.ObjectId(userId));

//     const followingUser = await Promise.all(
//       user.Following.map((item) => {
//         return userModel.findById(item);
//       })
//     );

//     let followingList = [];

//     followingUser.map((person) => {
//       const { email, password, phonenumber, Following, Followers, ...others } =
//         person._doc;
//       followingList.push(others);
//     });

//     res.status(200).send({
//       success: true,
//       message: "Lấy người đang theo dõi mình thành công",
//       followingList,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       success: false,
//       message: "Lỗi server",
//       error: error.message,
//     });
//   }
// };
export const getAFollowingControler = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const followingUser = await Promise.all(
      user.Following.map((item) => {
        return userModel.findById(item);
      })
    );

    let followingList = [];

    followingUser.map((person) => {
      const { email, password, phonenumber, Following, Followers, ...others } =
        person._doc;
      followingList.push(others);
    });

    res.status(200).send({
      success: true,
      message: "Lấy người đang theo dõi mình thành công",
      followingList,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

//Lấy người dùng mình follow
export const getAFollowersControler = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    const followerUser = await Promise.all(
      user.Followers.map((item) => {
        return userModel.findById(item);
      })
    );

    let followersList = [];

    followerUser.map((person) => {
      const { email, password, phonenumber, Following, Followers, ...others } =
        person._doc;
      followersList.push(others);
    });

    res.status(200).send({
      success: true,
      message: "Lấy người đang theo dõi mình thành công",
      followersList,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error,
    });
  }
};
export const createMessageController = async (req, res) => {
  try {
    const { from, to, message } = req.body;

    const newMessage = await Message.create({
      message: message,
      Chatuser: [from, to],
      Sender: from,
    });

    return res.status(200).send({
      success: true,
      message: "Tạo tin nhắn thành công",
      newMessage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error,
    });
  }
};

export const getMessageController = async (req, res) => {
  try {
    const from = req.params.user1Id;
    const to = req.params.user2Id;

    const newMessage = await Message.find({
      Chatuser: {
        $all: [from, to],
      },
    }).sort({ updateAt: 1 });

    const allMessage = newMessage.map((msg) => {
      return {
        myself: msg.Sender.toString() === from,
        message: msg.message,
      };
    });

    return res.status(200).send({
      success: true,
      message: "Lấy tất cả tin nhắn từ người dùng thành công",
      allMessage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi server",
      error,
    });
  }
};
