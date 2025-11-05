import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "supersecret";

const signKey = (rawKey, userId) => {
  return jwt.sign({ key: rawKey, userId }, SECRET, { expiresIn: "15m" });
};

const verifyKey = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
};

export default { signKey, verifyKey };
