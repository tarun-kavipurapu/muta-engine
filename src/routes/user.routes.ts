import { Router } from "express";
import { login, signup } from "../controllers/user.controllers";
import Validate from "../middlewares/validation.middleware";
import { signupSchema } from "../validators/user.validator";

const router = Router();

router.route("/login").get(login);
router.route("/signup").post(Validate(signupSchema), signup);

export default router;
