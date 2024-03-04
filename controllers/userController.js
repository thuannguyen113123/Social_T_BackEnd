import userModel from "../models/userModel.js";
import { generateOTP } from "../Extra/mail.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import nodemailer from "nodemailer";
import VerificationToken from "../models/VerificationToken.js";
import ResetToken from "../models/ResetToken.js";
import bcrypt from "bcrypt";
import postModel from "../models/postModel.js";
import crypto from "crypto";

const JWTSEC = "#2@!@$ndja45883 r7##";
export const registerController = async (req, res) => {
  try {
    const { username, email, password, profile, phonenumber } = req.body;

    // Xử lý các trường hợp người dùng không nhập gì
    if (!username) {
      return res.send({ error: "Tên người dùng là bắt buộc" });
    }
    if (!email) {
      return res.send({ error: "Email là bắt buộc" });
    }
    if (!password) {
      return res.send({ error: "Mật khẩu là bắt buộc" });
    }
    if (!profile) {
      return res.send({ error: "Số điện thoại là bắt buộc" });
    }
    if (!phonenumber) {
      return res.send({ error: "Địa chỉ là bắt buộc" });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Đăng ký không thành công. Email đã tồn tại.",
      });
    }
    const hashedPassword = await hashPassword(password);

    const user = await new userModel({
      username,
      email,
      password: hashedPassword,
      profile,
      phonenumber,
    }).save();

    const accessToken = JWT.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWTSEC
    );

    const OTP = generateOTP();
    const verificationToken = await VerificationToken.create({
      user: user._id,
      token: OTP,
    });
    await user.save();

    verificationToken.save();

    var transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.userMail,
        pass: process.env.passMail,
      },
      authMethod: "PLAIN", // Thêm dòng này để xác định sử dụng giao thức "PLAIN"
    });
    transport.sendMail({
      from: "TSocial@gmail.com",
      to: user.email,
      subject: "Xác minh email của bạn bằng OTP",
      html: `<h1>Mã OTP của bạn là ${OTP}</h1>`,
    });

    res.status(200).json({
      Status: "Pending",
      msg: "Vui lòng kiểm tra email",
      user: user._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Lỗi khi đăng ký",
      error,
    });
  }
};

//Xác thức email
export const verifyEmailController = async (req, res) => {
  const { user, OTP } = req.body;
  const mainUser = await userModel.findById(user);
  if (!mainUser) {
    return res.status(400).send({
      success: false,
      message: "Tài khoản không tồn tại",
    });
  }
  if (mainUser === true) {
    return res.status(400).send({
      success: false,
      message: "Người dùng đã được xác minh",
    });
  }
  const token = await VerificationToken.findOne({ user: mainUser._id });
  if (!token) {
    return res.status(400).send({
      success: false,
      message: "Xin lỗi không tìm thấy token",
    });
  }
  const isMatch = await bcrypt.compareSync(OTP, token.token);
  if (!isMatch) {
    return res.status(400).send({
      success: false,
      message: "token không hợp lệ",
    });
  }
  mainUser.verifed = true;
  await VerificationToken.findByIdAndDelete(token._id);
  await mainUser.save();

  // Gắn token khi đăng nhập vào web
  const accessToken = await JWT.sign(
    { _id: mainUser._id, username: mainUser.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  const { password, ...other } = mainUser._doc;
  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.userMail,
      pass: process.env.passMail,
    },
  });
  transport.sendMail({
    from: "TSocial@gmail.com",
    to: user.email,
    subject: "Xác thực thành công",
    html: `<h1>Giờ bạn có thể đăng nhập</h1>`,
  });
  return res.status(200).json({ other, accessToken });
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    // email.isEmail(), password.isLength({ min: 6 });
    const user = await userModel.findOne({ email });

    if (!email || !password) {
      return res.status(404).send({
        success: false,
        message: "Email hoặc mật khẩu không hợp lệ",
      });
    }
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email chưa được đăng ký",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(200).send({
        success: false,
        message: "Mật khẩu không hợp lệ",
      });
    }
    // Gắn token khi đăng nhập vào web
    const accessToken = JWT.sign(
      {
        id: user._id,
        username: user.username,
      },
      JWTSEC
    );

    res.status(200).send({
      success: true,
      message: "Đăng nhập thành công",
      other: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phonenumber: user.phonenumber,
        profile: user.profile,
        Followers: user.Followers,
        Following: user.Following,
        verifed: user.verifed,
      },
      accessToken,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Lỗi đăng nhập",
      error,
    });
  }
};

//Quên mật khẩu
export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email: email });

  if (!user) {
    return res.status(400).send({
      success: false,
      message: "Sau một giờ, bạn có thể yêu cầu một mã thông báo khác",
    });
  }

  const RandomTxt = crypto.randomBytes(20).toString("hex");
  const resetToken = new ResetToken({
    user: user._id,
    token: RandomTxt,
  });
  await resetToken.save();

  const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.userMail,
      pass: process.env.passMail,
    },
  });

  // Specify the recipient's email address using the 'to' field
  transport.sendMail({
    from: "TSocial@gmail.com",
    to: user.email, // Specify the recipient's email address here
    subject: "Reset Token",
    html: `http://localhost:3000/reset-password?token=${RandomTxt}&_id=${user._id}`,
  });

  res.status(200).send({
    success: true,
    message: "Kiểm tra mật khẩu mới ở email của bạn",
  });
};

// export const forgotPasswordController = async (req, res) => {
//   const { email } = req.body;
//   const user = await userModel.findOne({ email: email });
//   if (!user) {
//     return res.status(400).send({
//       success: false,
//       message: "Sau một giờ, bạn có thể yêu cầu một mã thông báo khác",
//     });
//   }
//   const RandomTxt = crypto.randomBytes(20).toString("hex");
//   const resetToken = new ResetToken({
//     user: user._id,
//     token: RandomTxt,
//   });
//   await resetToken.save();
//   const transport = nodemailer.createTransport({
//     host: "smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//       user: process.env.userMail,
//       pass: process.env.passMail,
//     },
//   });
//   transport.sendMail({
//     from: "TSocial@gmail.com",
//     to: user.email,
//     subject: "Reset Token",
//     html: `http://localhost:3000/reset/password?token=${RandomTxt}&_id=${user._id}`,
//   });
//   res.status(200).send({
//     success: true,
//     message: "Kiểm tra mật khẩu mới ở email của bạn",
//   });
// };
//Cập nhật lại mật khẩu
export const resetPasswordController = async (req, res) => {
  const { token, _id } = req.query;
  if (!token || !_id) {
    res.status(400).send({
      success: false,
      message: "Phản hồi không hợp lệ",
    });
  }
  const user = await userModel.findOne({ _id: _id });
  if (!user) {
    res.status(400).send({
      success: false,
      message: "Không tìm thấy người dùng",
    });
  }
  const resetToken = await ResetToken.findOne({ user: user._id });
  if (!resetToken) {
    return res.status(400).json("Không tìm thấy mã token");
  }
  const isMatch = await bcrypt.compareSync(token, resetToken.token);
  if (!isMatch) {
    return res.status(400).json("Token không hợp lệ");
  }

  const { password } = req.body;
  const secpass = await bcrypt.hash(password, 10);
  user.password = secpass;
  await user.save();

  const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.userMail,
      pass: process.env.passMail,
    },
  });
  transport.sendMail({
    from: "TSocial@gmail.com",
    to: user.email,
    subject: "Mật khẩu đã khỡi tạo lại thành công",
    html: `giờ bạn có thể đăng nhập với mk mới`,
  });
  res.status(200).send({
    success: true,
    message: "Email đã được gửi",
  });
};
//Theo dõi
export const getSingleFollowingController = async (req, res) => {
  //Kiểm tra Id truyền qua url có khác với id truyền trong yêu cầu(để kiểm tra xem người dùng này đã theo dõi người dùng kia chưa)
  //Nếu rồi thì bỏ theo dõi nếu chưa thì theo dõi
  if (req.params.id !== req.body.user) {
    const user = await userModel.findById(req.params.id);
    const otherUser = await userModel.findById(req.body.user);
    //includes(kiểm tra phần tử có tồn tại hay chưa)
    if (!user.Followers.includes(req.body.user)) {
      //updateOne(cập nhật 1 phần tử duy nhất trong csdl)
      //$push thêm 1 dữ liệu vào mảng
      await user.updateOne({ $push: { Followers: req.body.user } });
      await otherUser.updateOne({ $push: { Following: req.params.id } });
      return res
        .status(200)
        .send({ success: true, message: "Người dùng đã theo dõi" });
    } else {
      await user.updateOne({ $pull: { Followers: req.body.user } });
      await otherUser.updateOne({ $pull: { Following: req.params.id } });
      return res
        .status(200)
        .send({ success: true, message: "Người dùng đã hủy theo dõi" });
    }
  } else {
    return res
      .status(400)
      .send({ success: false, message: "Bạn không thể theo dõi chính mình" });
  }
};
//Lấy các bài đăng của người dùng đã fl
export const getPostFromUserController = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    const followersPost = await Promise.all(
      user.Following.map((item) => {
        return postModel.find({ user: item });
      })
    );
    const userPost = await postModel.find({ user: user._id });

    return res.status(200).send({
      success: true,
      message: "Lấy thành công",
      post: [...userPost, ...followersPost.flat()],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Lỗi từ Server",
      error,
    });
  }
};
//cập nhật thông tin người dùng
export const updateUserController = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      if (req.body.password) {
        const hashedPassword = await hashPassword(password);
        req.body.password = hashedPassword;
        const updateUser = await userModel.findByIdAndUpdate(req.params.id, {
          $set: req.body,
        });
        await updateUser.save();
        return res.status(200).send({
          success: true,
          message: "Cập nhật thành công ",
          updateUser,
        });
      } else {
        return res.status(400).send({
          success: true,
          message: "Bạn không được phép cập nhật thông tin người dùng này",
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Lỗi từ Server",
      error,
    });
  }
};

export const getUserDetailController = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    const { email, password, phonenumber, ...others } = user._doc;
    return res.status(200).send({
      success: true,
      message: "Lấy thông tin người dùng thành công",
      others,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Lỗi từ Server",
      error,
    });
  }
};
//Lấy tất cả user mình follow
export const getAllUserFollowController = async (req, res) => {
  try {
    const allUser = await userModel.find();
    const user = await userModel.findById(req.params.id);
    //Promise.all chờ để lấy hết danh sách
    const followingUser = await Promise.all(
      user.Following.map((item) => {
        return item;
      })
    );
    let userToFollow = allUser.filter((val) => {
      return !followingUser.find((item) => {
        return val._id.toString() === item;
      });
    });

    let filterUser = await Promise.all(
      userToFollow.map((item) => {
        const {
          email,
          phonenumber,
          Followers,
          Following,
          password,
          ...others
        } = item._doc;
        return others;
      })
    );
    return res.status(200).send({
      success: true,
      message: "Lấy thông tin người dùng đã follow thành công",
      filterUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Lỗi từ Server",
      error,
    });
  }
};
