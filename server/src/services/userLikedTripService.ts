import { Prisma } from "../generated/prisma/client";
import prisma from "../db/prisma";

export async function userHasLikedTrip(
  userId: number,
  tripId: number
): Promise<boolean> {
  const row = await prisma.userLikedTrip.findFirst({
    where: { userId, tripId },
    select: { userId: true },
  });
  return row !== null;
}

export async function listUserLikedTrips(userId: number) {
  const rows = await prisma.userLikedTrip.findMany({
    where: { userId },
    orderBy: { dateCreated: "desc" },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          dateCreated: true,
          user: { select: { username: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.trip.id,
    title: row.trip.title,
    dateCreated: row.trip.dateCreated.toISOString(),
    createdByUsername: row.trip.user.username,
  }));
}

export async function addUserLikedTrip(userId: number, tripId: number) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  try {
    await prisma.userLikedTrip.create({
      data: { userId, tripId },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: true as const, alreadyLiked: true };
    }
    throw err;
  }

  return { ok: true as const, alreadyLiked: false };
}

export async function removeUserLikedTrip(userId: number, tripId: number) {
  await prisma.userLikedTrip.deleteMany({
    where: { userId, tripId },
  });
}
