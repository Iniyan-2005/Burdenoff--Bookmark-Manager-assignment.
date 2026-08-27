import { PrismaClient } from "@prisma/client";
import { prisma } from "./db.js";

export interface GraphQLContext {
  prisma: PrismaClient;
}

export function createContext(): GraphQLContext {
  return { prisma };
}
