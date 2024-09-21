import { Response } from "express";
import { prismaClient } from "..";
import { IGetUserAuthInfoRequest } from "../secrets";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

export const addItemOrUpdateItemQuantity = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
    const userId = req.user.id;

    // fetch user cart
    let cart = await prismaClient.cart.findFirst({
      where: { ownerId: userId },
      include: { CartItem: true },
    });

    if (!cart) {
      cart = await prismaClient.cart.create({
        data: { ownerId: userId },
        include: { CartItem: true },
      });
    }

    // See if product that user is adding exist in the db
    const product = await prismaClient.product.findUnique({
      where: {
        id: parseInt(productId),
      },
    });

    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }

    // If product is there check if the quantity that user is adding is less than or equal to the product's stock
    if (quantity > product.stock) {
      // if quantity is greater throw an error
      throw new ApiError(
        400,
        product.stock > 0
          ? "Only " +
            product.stock +
            " products are remaining. But you are adding " +
            quantity
          : "Product is out of stock"
      );
    }

    // See if the product that user is adding already exists in the cart
    const addedProduct = cart.CartItem?.find(
      (item) => item.productId.toString() === productId
    );

    if (addedProduct) {
      // If product already exist assign a new quantity to it
      // ! We are not adding or subtracting quantity to keep it dynamic. Frontend will send us updated quantity here
      addedProduct.quantity = quantity;
      // if user updates the cart remove the coupon associated with the cart to avoid misuse
      // Do this only if quantity changes because if user adds a new project the cart total will increase anyways
    } else {
      // if its a new product being added in the cart push it to the cart items
      await prismaClient.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity },
      });
    }

    // Re-fetch the updated cart with cart items and product details
    const updatedCart = await prismaClient.cart.findFirst({
      where: { ownerId: userId },
      include: {
        CartItem: {
          include: {
            product: true, // Include product details for each cart item
          },
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedCart, "Item added successfully"));
  }
);

export const removeItemFromCart = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    const { productId } = req.params;

    const product = await prismaClient.product.findUnique({
      where: {
        id: Number(productId),
      },
    });

    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }

    const cart = await prismaClient.cart.findFirst({
      where: {
        ownerId: req.user.id,
      },
      include: {
        CartItem: true,
      },
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const cartItem = cart.CartItem.find((product) => {
      product.productId == parseInt(productId);
    });

    if (!cartItem) {
      throw new ApiError(404, "Product is not in the cart");
    }

    await prismaClient.cart.delete({
      where: {
        id: cartItem.id,
      },
    });
    const updatedCart = await prismaClient.cart.findFirst({
      where: { ownerId: req.user.id },
      include: {
        CartItem: {
          include: {
            product: true, // Include product details for calculating the cart total
          },
        },
      },
    });

    // Calculate the new cart total
    const cartTotal =
      updatedCart?.CartItem.reduce((total: number, item: any) => {
        return total + item.product.price * item.quantity;
      }, 0) || 0;

    const finalCart = await prismaClient.cart.findFirst({
      where: {
        ownerId: req.user.id,
      },
      include: {
        CartItem: {
          include: {
            product: true,
          },
        },
      },
    });
    return res

      .status(200)
      .json(new ApiResponse(200, finalCart, "Cart item removed successfully"));
  }
);

export const getUserCart = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    const cart = await prismaClient.cart.findFirst({
      where: {
        ownerId: req.user.id,
      },
      include: {
        CartItem: {
          include: {
            product: true, // Include product details in each cart item
          },
        },
      },
    });

    if (!cart) {
      throw new ApiError(404, "Cart Not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, cart, "Cart fetched successfully"));
  }
);
export const clearCart = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    const Cart = await prismaClient.cart.findFirst({
      where: { ownerId: req.user.id },
    });

    if (!Cart) {
      return res.status(404).json(new ApiResponse(404, null, "Cart not found"));
    }

    // Delete all cart items associated with the cart
    await prismaClient.cartItem.deleteMany({
      where: {
        cartId: Cart.id,
      },
    });

    const cart = await prismaClient.cart.deleteMany({
      where: {
        ownerId: req.user.id,
      },
    });

    if (!cart) {
      throw new ApiError(404, "Cart Not found");
    }
    const updatedCart = await prismaClient.cart.findFirst({
      where: { ownerId: req.user.id },
      include: {
        CartItem: {
          include: {
            product: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, updatedCart, "Cart has been cleared"));
  }
);
