import "../src/env.ts";
import prisma from "../src/db/prisma.ts";

const [e, t, i] = await Promise.all([
  prisma.experience.count(),
  prisma.trip.count(),
  prisma.interest.count(),
]);
console.log("DB OK — experiences:", e, "trips:", t, "interests:", i);
await prisma.$disconnect();
