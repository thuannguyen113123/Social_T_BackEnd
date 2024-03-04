import JWT from "jsonwebtoken";
const JWTSEC = "#2@!@$ndja45883 r7##";
//Xác thực token để truy cấp vào web
export const requireSignIn = async (req, res, next) => {
  const authHeader = req.headers.token;
  if (authHeader) {
    const token = authHeader;
    JWT.verify(token, JWTSEC, (err, user) => {
      if (err) return res.status(400).json("Some error occured");
      req.user = user;
      next();
    });
  } else {
    return res.status(400).json("Access token is not valid");
  }
};
