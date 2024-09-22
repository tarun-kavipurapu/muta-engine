import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  handleSocialLogin,
  login,
  logout,
  resetForgottenPassword,
  signup,
} from "../controllers/user.controllers";
import Validate from "../middlewares/validation.middleware";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "../validators/user.validator";
import passport from "passport";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.route("/login").post(Validate(loginSchema), login);
router.route("/signup").post(Validate(signupSchema), signup);
router.post("/logout", verifyJWT, logout);
router.get("/current-user", verifyJWT, getCurrentUser);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
  }),
  (req, res) => {
    console.log(" I am here in /google route");
    res.send("redirecting to google...");
  }
);

router
  .route("/google/callback")
  .get(passport.authenticate("google"), handleSocialLogin);

router
  .route("/forgot-password")
  .post(Validate(forgotPasswordSchema), forgotPassword);
router
  .route("/reset-password/:resetToken")
  .post(Validate(resetPasswordSchema), resetForgottenPassword);

export default router;
