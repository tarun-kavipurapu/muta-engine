import { Request, Response, NextFunction } from "express";
import { prismaClient } from "..";
import crypto from "crypto";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  hashPassword,
} from "../utils/JWT";
import { ApiError } from "../utils/ApiError";
import { StatusCodes } from "http-status-codes";
import {
  AvailableSocialLogins,
  FORGOT_PASSWORD_REDIRECT_URL,
  IGetUserAuthInfoRequest,
  NODE_ENV,
  REFRESH_TOKEN_EXPIRY,
} from "../secrets";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "@prisma/client";
import { forgotPasswordMailgenContent, sendMail } from "../utils/mail";
import axios from "axios";

const generateAcessandRefreshToken = async (userId: number) => {
  try {
    const user = await prismaClient.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const expiresInDays = parseInt(REFRESH_TOKEN_EXPIRY || "0");
      const expiresAt = new Date(
        Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      );

      const refreshTokenCreateObject = await prismaClient.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: expiresAt,
        },
      });
      return { accessToken, refreshToken };
    } else {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "User not found");
    }
  } catch (error) {
    console.error(error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error Creating Access and RefreshToken"
    );
  }
};
const verifyRecaptcha = async (token: string) => {
  const secretKey = process.env.CAPTCHA_SECRET_KEY;
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const response = await axios.post(verifyUrl);
    return response.data.success;
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return false;
  }
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, recaptchaToken } = req.body;

  //find user by email
  const user = await prismaClient.user.findUnique({
    where: {
      email: email,
    },
  });
  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    throw new ApiError(404, "reCAPTCHA verification failed");
  }

  //if usernot found send the error simply
  if (user == null) {
    throw new ApiError(409, "User with this Email Does not Exist", []);
  }
  if (user.loginType !== AvailableSocialLogins.EMAIL_PASSWORD) {
    // If user is registered with some other method, we will ask him/her to use the same method as registered.
    // This shows that if user is registered with methods other than email password, he/she will not be able to login with password. Which makes password field redundant for the SSO
    throw new ApiError(
      400,
      "You have previously registered using " +
        user.loginType?.toLowerCase() +
        ". Please use the " +
        user.loginType?.toLowerCase() +
        " login option to access your account."
    );
  }

  if (!user.password) {
    throw new ApiError(
      409,
      "User Does not Have a password Maybe an Google Signin User",
      []
    );
  }

  const isSame = await comparePassword(password, user.password);

  if (isSame == false) {
    throw new ApiError(409, "The password/email you have entered is wrong", []);
  }
  //generate the refresh and acess token and just send the response and set the cookie
  const { accessToken, refreshToken } = await generateAcessandRefreshToken(
    user.id
  );

  const userSend = await prismaClient.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      email: true,
      loginType: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  // TODO: Add more options to make cookie more secure and reliable
  const options = {
    httpOnly: true,
    secure: NODE_ENV === "production",
    // sameSite: "Strict", // Controls cross-site request behavior
    // maxAge: 24 * 60 * 60 * 1000, // Sets cookie expiration (in milliseconds)
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: userSend, accessToken, refreshToken },
        "Users registered successfully ."
      )
    );
});

export const logout = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    //  invalidate the refresh token in the database here
    // For example:
    // await prismaClient.refreshToken.deleteMany({
    //   where: { userId: req.user.id },
    // });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Logged out successfully"));
  }
);
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    // Assuming you have a middleware that attaches the user to the request
    // If not, you'll need to verify the access token and fetch the user
    const { id } = req.user as User;

    if (!id) {
      throw new ApiError(401, "Unauthorized access", []);
    }

    const user = await prismaClient.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        loginType: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found", []);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { user }, "User details fetched successfully")
      );
  }
);

//here error Handling is Already Taken Care by asyncHandler
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  const existedUser = await prismaClient.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists", []);
  }

  const hashedPassword = await hashPassword(password);
  const user = await prismaClient.user.create({
    data: {
      email: email,
      password: hashedPassword,
      name: username,
      loginType: AvailableSocialLogins.EMAIL_PASSWORD,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      loginType: true,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(200, { user: user }, "Users registered successfully .")
    );
});

export const handleSocialLogin = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    const user = await prismaClient.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    const { accessToken, refreshToken } = await generateAcessandRefreshToken(
      user.id
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    return res
      .status(301)
      .cookie("accessToken", accessToken, options) // set the access token in the cookie
      .cookie("refreshToken", refreshToken, options) // set the refresh token in the cookie
      .redirect(
        // redirect user to the frontend with access and refresh token in case user is not using cookies
        `${process.env.CLIENT_SSO_REDIRECT_URL}`
      );
  }
);

//captcha

//forgot password

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await prismaClient.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new ApiError(404, "User Does not Exists", []);
    }
    if (user.loginType != AvailableSocialLogins.EMAIL_PASSWORD) {
      throw new ApiError(
        404,
        "You have Logged In through OAuth Hence You cannot Avail Forget Password"
      );
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
      generateTemporaryToken();

    const passwordReset = await prismaClient.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(tokenExpiry),
        used: false,
      },
    });

    await sendMail({
      email: user?.email,
      subject: "Password Reset Request ",
      mailgenContent: forgotPasswordMailgenContent(
        user.name,
        // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
        // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
        `${FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
      ),
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Password reset mail has been sent on your mail id"
        )
      );
  }
);

export const resetForgottenPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;
    let hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetTokenRecord = await prismaClient.passwordResetToken.findUnique({
      where: {
        token: hashedToken,
        expiresAt: {
          gt: new Date(), // Make sure the token has not expired
        },
        used: false, // Ensure the token hasn't been used
      },
      include: {
        user: true, // Include the related user
      },
    });

    if (!resetTokenRecord) {
      throw new ApiError(400, "Token is invalid or expired");
    }

    const hashedPassword = await hashPassword(newPassword);
    await prismaClient.user.update({
      where: {
        id: resetTokenRecord.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    //delete the token
    //you can also mark it as used
    await prismaClient.passwordResetToken.delete({
      where: {
        token: hashedToken,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password reset successfully"));
  }

  // Create a hash of the incoming reset token
);

//generate a token with email or

//reset password
