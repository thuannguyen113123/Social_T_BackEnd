import mongoose from "mongoose";
// import mysql from "mysql";
// import pg from "pg"; // Sử dụng import toàn bộ thư viện pg

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`Kết nối đến cơ sở dữ liệu MongoDB ${conn.connection.host}`);
  } catch (error) {
    console.log(`Lỗi kết nối cơ sở dữ liệu MongoDB ${error}`);
  }
};

// const mysqlConnection = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "socialmediasharding",
// });

// mysqlConnection.connect((err) => {
//   if (err) {
//     console.error("Lỗi kết nối cơ sở dữ liệu MySQL:", err);
//     return;
//   }
//   console.log("Kết nối thành công đến cơ sở dữ liệu MySQL");
// });

// // Kết nối PostgreSQL
// const pgClient = new pg.Client({
//   user: "postgres",
//   host: "localhost",
//   database: "socialmediasharding",
//   password: "113123",
//   port: 5432,
// });

// await pgClient.connect();
// console.log("Kết nối thành công đến cơ sở dữ liệu PostgreSQL ");

export { connectDB };
// , mysqlConnection, pgClient
