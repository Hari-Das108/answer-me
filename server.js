import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import app from "./app.js";

const port = process.env.PORT || 5000;

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log("DB connnection successful!!");
});

// //production database connection
app.listen(port);

// development database connection
// app.listen(port, () => {
//   console.log(`App running on  http://127.0.0.1:${port}/`);
// });
