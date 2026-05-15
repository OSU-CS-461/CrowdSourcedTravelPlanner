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
        themePreference: "light",
      },
    });
  }

  return {
    preferredFeedSort: settings.preferredFeedSort,
    themePreference: settings.themePreference,
    lastUpdated: settings.lastUpdated,
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

  return {
    preferredFeedSort: updated.preferredFeedSort,
    themePreference: updated.themePreference,
    lastUpdated: updated.lastUpdated,
  };
}
