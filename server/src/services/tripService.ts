import prisma from "../db/prisma";


// --- CREATE ---

interface TripCreateInput {
  title: string;
  description?: string;
  createdBy: number;
  startDate?: string;
  endDate?: string;
}

export async function createTrip(postBody: TripCreateInput) {
  return prisma.trip.create({
    data: {
      title: postBody.title,
      description: postBody.description,
      createdBy: postBody.createdBy,
      startDate: postBody.startDate ? new Date(postBody.startDate) : null,
      endDate: postBody.endDate ? new Date(postBody.endDate) : null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
      startDate: true,
      endDate: true,
    },
  });
}


// --- GET ---

export async function getTrip(tripId: number) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      title: true,
      description: true,
      createdBy: true,
      dateCreated: true,
      lastUpdated: true,
      startDate: true,
      endDate: true,
      experiences: {
        include: {
          experience: true,
        },
      },
    },
  });
}


// --- LIST  ---

interface ListTripsParams {
  limit: number;
  offset: number;
  where?: any;
  orderBy?: any;
}

export async function listTrips(params: ListTripsParams) {
  const { limit, offset, where, orderBy } = params;

  return prisma.trip.findMany({
    skip: offset,
    take: limit,
    where,
    orderBy: orderBy || { dateCreated: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
      startDate: true,
      endDate: true,
    },
  });
}


// --- UPDATE---

interface UpdateTripParams {
  tripId: number;
  userId: number;
  putData: {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  };
}

export async function updateTrip(params: UpdateTripParams) {
  const { tripId, userId, putData } = params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) return null;

  if (trip.createdBy !== userId) {
    throw { status: 403, message: "User does not own this trip" };
  }

  return prisma.trip.update({
    where: { id: tripId },
    data: putData,
    select: {
      id: true,
      title: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
      startDate: true,
      endDate: true,
    },
  });
}


// --- PATCH ---

interface EditTripParams {
  tripId: number;
  userId: number;
  patchData: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  };
}

export async function editTrip(params: EditTripParams) {
  const { tripId, userId, patchData } = params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) return null;

  if (trip.createdBy !== userId) {
    throw { status: 403, message: "User does not own this trip" };
  }

  return prisma.trip.update({
    where: { id: tripId },
    data: patchData,
    select: {
      id: true,
      title: true,
      description: true,
      dateCreated: true,
      lastUpdated: true,
      createdBy: true,
      startDate: true,
      endDate: true,
    },
  });
}


// --- DELETE ---

interface DeleteTripParams {
  tripId: number;
  userId: number;
}

export async function deleteTrip(params: DeleteTripParams) {
  const { tripId, userId } = params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw { status: 404, message: "Trip not found" };
  }

  if (trip.createdBy !== userId) {
    throw { status: 403, message: "User does not own this trip" };
  }

  await prisma.trip.delete({
    where: { id: tripId },
  });
}


// --- ADD EXPERIENCE ---

export async function addExperienceToTrip(
  tripId: number,
  experienceId: number,
  userId: number
) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) throw { status: 404, message: "Trip not found" };

  if (trip.createdBy !== userId) {
    throw { status: 403, message: "User does not own this trip" };
  }

  return prisma.tripExperience.create({
    data: {
      tripId,
      experienceId,
    },
  });
}


// --- REMOVE EXPERIENCE ---

export async function removeExperienceFromTrip(
  tripId: number,
  experienceId: number,
  userId: number
) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) throw { status: 404, message: "Trip not found" };

  if (trip.createdBy !== userId) {
    throw { status: 403, message: "User does not own this trip" };
  }

  return prisma.tripExperience.delete({
    where: {
      tripId_experienceId: {
        tripId,
        experienceId,
      },
    },
  });
}