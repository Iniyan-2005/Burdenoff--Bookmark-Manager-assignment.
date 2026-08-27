import { PrismaClient, Folder } from "@prisma/client";
import { Errors } from "../errors.js";

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
      throw Errors.FOLDER_NOT_FOUND(`Folder with id ${id} not found.`);
    }
    return folder;
  }

  async getFolderBookmarks(folderId: string) {
    return this.prisma.bookmark.findMany({
      where: { folderId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createFolder(name: string): Promise<Folder> {
    if (!name || name.trim() === "") {
      throw Errors.INVALID_FOLDER_NAME();
    }
    return this.prisma.folder.create({
      data: { name: name.trim() },
    });
  }
}
