import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prismaClient } from "..";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import NodeCache from "node-cache";

const nodeCache = new NodeCache({
  stdTTL: 60,
});
//TODO:while writing update and delete api make sure to remove the nodecache

export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    let products;

    //fetch alll the products from the prisma
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    if (nodeCache.has("products")) {
      products = JSON.parse(nodeCache.get("products") as string);
    } else {
      products = await prismaClient.product.findMany({
        skip: skip,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      nodeCache.set("products", JSON.stringify(products));
    }

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

// export const createProducts = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { name, description, category, price, stock, ImageUrl } = req.body;
//   }
//   // Check if user has uploaded a main image
//   // if (!req.files?.mainImage || !req.files?.mainImage.length) {
//   //   throw new ApiError(400, "Main image is required");
//   // }
// );
