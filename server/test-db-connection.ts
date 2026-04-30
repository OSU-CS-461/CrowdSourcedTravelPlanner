import prisma from "./src/db/prisma";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    await prisma.$connect();
    console.log("Database connection successful!");
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Database query successful!");
    console.log("Result:", result);
    
    // Check if User table exists
    try {
      const userCount = await prisma.user.count();
      console.log(`User table exists. Current user count: ${userCount}`);
    } catch {
      console.log("User table might not exist or migrations not run");
      console.log("Run: npx prisma migrate dev");
    }
    
  } catch (error: unknown) {
    const errorCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Database connection failed!");
    console.error("Error:", errorMessage);
    if (errorCode === "P1001") {
      console.log("\nCannot reach database server.");
      console.log("Make sure Prisma dev is running: npx prisma dev");
    } else if (errorCode === "P5010") {
      console.log("\nFailed to contact the database service.");
      console.log("Check your DATABASE_URL in .env file");
      console.log("Make sure Prisma dev is running and the URL is correct");
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
