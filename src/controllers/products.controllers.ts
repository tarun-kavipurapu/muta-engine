import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prismaClient } from "..";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    //fetch alll the products from the prisma
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const products = await prismaClient.product.findMany({
      skip: skip,
      take: limit,
      include: {
        owner: true,
      },
    });

    const totalProducts = await prismaClient.product.count();

    const totalPages = Math.ceil(totalProducts / limit);
    const response = {
      totalProducts,
      products,
      page,
      limit,
      totalPages,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, response, "Products fetched successfully"));
  }
);

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await prismaClient.product.findUnique({
      where: {
        id: Number(id),
      },
    });
    if (!product) {
      throw new ApiError(404, "Product does not exist");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched successfully"));
  }
);
