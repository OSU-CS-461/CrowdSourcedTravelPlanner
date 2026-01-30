import "dotenv/config";
import prisma from "./src/db/prisma";
import * as argon2 from "argon2";

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    });

    if (existingUser) {
      console.log("Test user already exists!");
      console.log("Email: test@example.com");
      console.log("Password: testpassword123");
      return;
    }

    // Create test user
    const passwordDigest = await argon2.hash("testpassword123");
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        passwordDigest: passwordDigest,
      },
    });

    console.log("Test user created successfully!");
    console.log("Email: test@example.com");
    console.log("Password: testpassword123");
    console.log("Username: testuser");
    console.log(`User ID: ${user.id}`);
  } catch (error) {
    console.error("Error creating test user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
