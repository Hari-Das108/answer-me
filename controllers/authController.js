import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { promisify } from "util";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  if (process.env.NODE_ENV === "development") {
    console.log(token);
  }

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "none"; // ← Required for cross-origin in production
  }
  res.cookie("jwt", token, cookieOptions);

  //Remove password from output
  user.password = undefined;
  user.state = "authenticated";

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const logout = (req, res) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.sameSite = "none";
  }

  res.cookie("jwt", "loggedout", cookieOptions);

  res.status(200).json({
    status: "success",
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    nameId: req.body.nameId,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createAndSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { nameId, password } = req.body;

  //1) Check if nameId and password exist
  if (!nameId || !password) {
    return next(new AppError("Please provide nameId and password!", 400));
  }

  //2) Check if user exists && password is correct
  const user = await User.findOne({ nameId }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect nameId or password", 401));
  }

  //3) If everything ok, send token to client
  createAndSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === "loggedout") {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  //2) Verification token
  let decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

export const getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found!!", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: {
        ...user.toObject(),
        state: "authenticated",
      },
    },
  });
});

export default { signup, login, logout, protect, getMe };
