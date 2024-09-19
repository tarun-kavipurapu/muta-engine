import { Router } from "express";
import { login, signup } from "../controllers/user.controllers";
import Validate from "../middlewares/validation.middleware";
import { loginSchema, signupSchema } from "../validators/user.validator";

const router = Router();

router.route("/login").post(Validate(loginSchema), login);
router.route("/signup").post(Validate(signupSchema), signup);

export default router;
