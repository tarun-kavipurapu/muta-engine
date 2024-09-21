import { CartItem, PrismaClient } from "@prisma/client";
import Razorpay from "razorpay";
import crypto, { randomUUID } from "crypto";
import { UUID } from "crypto";
import { ApiError } from "./../utils/ApiError"; // Assuming you have these utility classes
import { ApiResponse } from "./../utils/ApiResponse"; // Assuming you have these utility classes
import { sendMail, orderConfirmationMailgenContent } from "./../utils/mail"; // Assuming you have this email service
import { IGetUserAuthInfoRequest } from "../secrets";
import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

const prisma = new PrismaClient();

let razorpayInstance: any;
try {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error("RAZORPAY ERROR: ", error);
}

const orderFulfillmentHelper = async (
  orderPaymentId: string,
  req: IGetUserAuthInfoRequest
) => {
  const order = await prisma.ecomOrder.update({
    where: { paymentId: orderPaymentId },
    data: { isPaymentDone: true },
  });

  if (!order) {
    throw new ApiError(404, "Order does not exist");
  }

  const cart = await prisma.cart.findFirst({
    where: { ownerId: req.user.id },
    include: {
      CartItem: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.CartItem.length === 0) {
    throw new ApiError(400, "User cart is empty");
  }

  const userCart = await getCart(req.user.id);

  // Logic to handle product's stock change once order is placed
  const stockUpdates = userCart.items.map((item: any) =>
    prisma.product.update({
      where: { id: item.product.id },
      data: { stock: { decrement: item.quantity } },
    })
  );

  await prisma.$transaction(stockUpdates);

  await sendMail({
    email: req.user.email,
    subject: "Order confirmed",
    mailgenContent: orderConfirmationMailgenContent(
      req.user.name,
      userCart.items,
      order.orderPrice // Assuming you want to send the full price in the email
    ),
  });

  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      CartItem: { deleteMany: {} }, // Clear all items from the cart
    },
  });

  return order;
};

const generateRazorpayOrder = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    if (!razorpayInstance) {
      console.error("RAZORPAY ERROR: `key_id` is mandatory");
      throw new ApiError(500, "Internal server error");
    }

    const cart = await prisma.cart.findFirst({
      where: { ownerId: req.user.id },
      include: { CartItem: true },
    });

    if (!cart || cart.CartItem.length === 0) {
      throw new ApiError(400, "User cart is empty");
    }

    const userCart = await getCart(req.user.id);

    const orderOptions = {
      amount: userCart.cartTotal * 100, // in paisa
      currency: "INR",
      receipt: randomUUID,
    };

    razorpayInstance.orders.create(
      orderOptions,
      async (err: any, razorpayOrder: any) => {
        if (!razorpayOrder || (err && err.error)) {
          return res
            .status(err.statusCode)
            .json(
              new ApiResponse(
                err.statusCode,
                null,
                err.error.reason ||
                  "Something went wrong while initialising the razorpay order."
              )
            );
        }

        const unpaidOrder = await prisma.ecomOrder.create({
          data: {
            customerId: req.user.id,
            items: {
              create: cart.CartItem.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
            orderPrice: userCart.cartTotal,
            paymentProvider: "RAZORPAY",
            paymentId: razorpayOrder.id,
          },
        });

        if (unpaidOrder) {
          return res
            .status(200)
            .json(
              new ApiResponse(200, razorpayOrder, "Razorpay order generated")
            );
        } else {
          return res
            .status(500)
            .json(
              new ApiResponse(
                500,
                null,
                "Something went wrong while initialising the razorpay order."
              )
            );
        }
      }
    );
  }
);

const verifyRazorpayPayment = asyncHandler(
  async (req: IGetUserAuthInfoRequest, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    let expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const order = await orderFulfillmentHelper(razorpay_order_id, req);
      return res
        .status(201)
        .json(new ApiResponse(201, order, "Order placed successfully"));
    } else {
      throw new ApiError(400, "Invalid razorpay signature");
    }
  }
);

// Helper function to get cart details

export const getCart = async (userId: number) => {
  const cart = await prisma.cart.findFirst({
    where: { ownerId: userId },
    include: {
      CartItem: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    return {
      id: null,
      items: [],
      cartTotal: 0,
    };
  }

  // Calculate cart total
  const cartTotal = cart.CartItem.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);

  const cartData = {
    id: cart.id,
    items: cart.CartItem.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    })),
    cartTotal: cartTotal,
  };

  return cartData;
};
export { generateRazorpayOrder, verifyRazorpayPayment };
