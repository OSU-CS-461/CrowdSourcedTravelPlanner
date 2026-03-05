import prisma from "../db/prisma";

export async function getSettingsForUser(userId: number) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        preferredFeedSort: "newest",
      },
    });
  }

  return {
    preferredFeedSort: settings.preferredFeedSort,
    lastUpdated: settings.lastUpdated,
  };
}

export async function updateSettingsForUser(
  userId: number,
  data: { preferredFeedSort?: string }
) {
  const updated = await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      preferredFeedSort: data.preferredFeedSort ?? "newest",
    },
    update: {
      ...(data.preferredFeedSort != null && {
        preferredFeedSort: data.preferredFeedSort,
      }),
    },
  });

  return {
    preferredFeedSort: updated.preferredFeedSort,
    lastUpdated: updated.lastUpdated,
  };
}
