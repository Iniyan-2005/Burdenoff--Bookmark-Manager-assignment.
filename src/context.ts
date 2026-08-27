import { PrismaClient } from "@prisma/client";
import { prisma } from "./db.js";
import { FolderService } from "./services/folder.service.js";

export interface GraphQLContext {
  prisma: PrismaClient;
  folderService: FolderService;
}

export function createContext(): GraphQLContext {
  return { 
    prisma,
    folderService: new FolderService(prisma),
  };
}

