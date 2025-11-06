import { mockDeep } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

const prismaMock = mockDeep<PrismaClient>();
export default prismaMock;
