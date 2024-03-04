import bcrypt from "bcrypt";

//băm mật khậu tham số 10 là người ta thường sữ dụng
export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log(error);
  }
};

//so sánh mật khẩu với mật khẩu đã băm tham số thứ nhất là mật khẩu tham số thứ 2 là mật khẩu băm
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
