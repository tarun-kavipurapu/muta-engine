import { Router } from "express";
import { login, signup } from "../controllers/user.controllers";
import Validate from "../middlewares/validation.middleware";
import { loginSchema, signupSchema } from "../validators/user.validator";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/test").get(verifyJWT, async (req, res) => {
  res.send("Test");
});

export default router;
