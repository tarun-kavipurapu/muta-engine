import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { addItemOrUpdateItemQuantityValidator } from "../validators/cart.validators";
import Validate from "../middlewares/validation.middleware";
import {
  addItemOrUpdateItemQuantity,
  clearCart,
  getUserCart,
  removeItemFromCart,
} from "../controllers/cart.controllers";

const router = Router();

router.use(verifyJWT);

router
  .route("/item/:productId")
  .post(
    Validate(addItemOrUpdateItemQuantityValidator),
    addItemOrUpdateItemQuantity
  )
  .delete(removeItemFromCart);

router.route("/clear").delete(clearCart);
router.route("/").get(getUserCart);

export default router;
