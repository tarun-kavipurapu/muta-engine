import { faker } from "@faker-js/faker";
import { prismaClient } from "..";

export async function seeder() {
  const numberOfProducts = 50; // Adjust this number as needed
  const users = await prismaClient.user.findMany(); // Assuming you have users in your database

  const productPromises = Array.from({ length: numberOfProducts }, () => {
    return prismaClient.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 0, max: 1000 }),
        mainImageUrl: faker.image.url(),
        ownerId: users[Math.floor(Math.random() * users.length)].id,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    });
  });

  const createdProducts = await Promise.all(productPromises);

  console.log(`Created ${createdProducts.length} fake products.`);
}
