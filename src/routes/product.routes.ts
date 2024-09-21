import { Router } from "express";
import { login, signup } from "../controllers/user.controllers";
import Validate from "../middlewares/validation.middleware";
import { loginSchema, signupSchema } from "../validators/user.validator";
import {
  getAllProducts,
  getProductById,
} from "../controllers/products.controllers";

const router = Router();

router.route("/").get(getAllProducts);
router.route("/product/:id").get(getProductById);

export default router;
