import { PrismaClient } from "@prisma/client";
import { prisma } from "./db.js";
import { FolderService } from "./services/folder.service.js";
import { BookmarkService } from "./services/bookmark.service.js";

export interface GraphQLContext {
  prisma: PrismaClient;
  folderService: FolderService;
  bookmarkService: BookmarkService;
}

export function createContext(): GraphQLContext {
  return { 
    prisma,
    folderService: new FolderService(prisma),
    bookmarkService: new BookmarkService(prisma),
  };
}

