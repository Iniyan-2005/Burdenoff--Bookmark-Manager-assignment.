import { PrismaClient, Folder } from "@prisma/client";
import { GraphQLError } from "graphql";

export class FolderService {
  constructor(private prisma: PrismaClient) {}

  async getFolders(): Promise<Folder[]> {
    return this.prisma.folder.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getFolder(id: string): Promise<Folder> {
    const folder = await this.prisma.folder.findUnique({
      where: { id },
    });
    if (!folder) {
      throw new GraphQLError(`Folder with id ${id} not found.`);
    }
    return folder;
  }

  async getFolderBookmarks(folderId: string) {
    return this.prisma.bookmark.findMany({
      where: { folderId },
      orderBy: { createdAt: "desc" },
    });
  }
}

