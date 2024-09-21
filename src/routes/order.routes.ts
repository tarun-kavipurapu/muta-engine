import { Router } from "express";
import {
  generateRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/order.controllers";
import { razorpaySchema } from "../validators/order.validators";
import Validate from "../middlewares/validation.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/provider/razorpay").post(generateRazorpayOrder);
router
  .route("/provider/razorpay/verify-payment")
  .post(Validate(razorpaySchema), verifyRazorpayPayment);

export default router;
