import prisma from "../db/prisma";

async function getEmailForUser(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return user.email;
}

export async function getSettingsForUser(userId: number) {
  let row = await prisma.userSettings.findUnique({
    where: { userId },
    include: { user: { select: { email: true } } },
  });

  if (!row) {
    await prisma.userSettings.create({
      data: {
        userId,
        preferredFeedSort: "newest",
        themePreference: "light",
      },
    });
    row = await prisma.userSettings.findUniqueOrThrow({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
  }

  return {
    email: row.user.email,
    preferredFeedSort: row.preferredFeedSort,
    themePreference: row.themePreference,
    lastUpdated: row.lastUpdated,
  };
}

export async function updateSettingsForUser(
  userId: number,
  data: { preferredFeedSort?: string; themePreference?: string }
) {
  const updated = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      preferredFeedSort: data.preferredFeedSort ?? "newest",
      themePreference: data.themePreference ?? "light",
    },
    update: {
      ...(data.preferredFeedSort != null && {
        preferredFeedSort: data.preferredFeedSort,
      }),
      ...(data.themePreference != null && {
        themePreference: data.themePreference,
      }),
    },
  });

  const email = await getEmailForUser(userId);

  return {
    email,
    preferredFeedSort: updated.preferredFeedSort,
    themePreference: updated.themePreference,
    lastUpdated: updated.lastUpdated,
  };
}
