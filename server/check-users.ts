import "dotenv/config";
import prisma from "./src/db/prisma";

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (users.length === 0) {
      console.log("No users found in database.");
      console.log("You need to register a new account at http://localhost:5173/signup");
    } else {
      console.log(`Found ${users.length} user(s) in database:\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   ID: ${user.id}\n`);
      });
      console.log("Note: Passwords are hashed and cannot be retrieved.");
      console.log("If you don't know the password, register a new account or reset it.");
    }
  } catch (error) {
    console.error("Error checking users:", error);
    if (error instanceof Error && error.message.includes("P1001")) {
      console.log("\nDatabase connection error.");
      console.log("Make sure Prisma dev is running: npx prisma dev");
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
