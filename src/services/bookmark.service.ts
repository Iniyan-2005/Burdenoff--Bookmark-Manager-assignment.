import { PrismaClient, Prisma, Bookmark } from "@prisma/client";
import { Errors } from "../errors.js";

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

export class BookmarkService {
  constructor(private prisma: PrismaClient) {}

  async getBookmarks(params: {
    folderId?: string | null;
    search?: string | null;
    take?: number | null;
    cursor?: string | null;
  }) {
    const where: Prisma.BookmarkWhereInput = {};

    if (params.folderId) {
      where.folderId = params.folderId;
    }

    if (params.search && params.search.trim() !== "") {
      where.title = {
        contains: params.search.trim(),
        mode: "insensitive",
      };
    }

    const nodes = await this.prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return {
      nodes,
      endCursor: null,
      hasNextPage: false,
    };
  }

  async createBookmark(data: { title: string; url: string; tags?: string[] | null; folderId: string }): Promise<Bookmark> {
    if (!data.title || data.title.trim() === "") {
      throw Errors.INVALID_BOOKMARK_TITLE();
    }
    if (!isValidUrl(data.url)) {
      throw Errors.INVALID_BOOKMARK_URL();
    }

    const folderExists = await this.prisma.folder.findUnique({ where: { id: data.folderId } });
    if (!folderExists) {
      throw Errors.FOLDER_NOT_FOUND(`Folder with id ${data.folderId} not found.`);
    }

    return this.prisma.bookmark.create({
      data: {
        title: data.title.trim(),
        url: data.url,
        tags: data.tags || [],
        folderId: data.folderId,
      },
    });
  }

  async updateBookmark(id: string, data: { title?: string | null; url?: string | null; tags?: string[] | null }): Promise<Bookmark> {
    const existing = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!existing) {
      throw Errors.BOOKMARK_NOT_FOUND(`Bookmark with id ${id} not found.`);
    }

    const updateData: Prisma.BookmarkUpdateInput = {};
    if (data.title !== undefined && data.title !== null) {
      if (data.title.trim() === "") {
        throw Errors.INVALID_BOOKMARK_TITLE();
      }
      updateData.title = data.title.trim();
    }
    
    if (data.url !== undefined && data.url !== null) {
      if (!isValidUrl(data.url)) {
        throw Errors.INVALID_BOOKMARK_URL();
      }
      updateData.url = data.url;
    }
    
    if (data.tags !== undefined && data.tags !== null) {
      updateData.tags = data.tags;
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBookmark(id: string): Promise<Bookmark> {
    const existing = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!existing) {
      throw Errors.BOOKMARK_NOT_FOUND(`Bookmark with id ${id} not found.`);
    }

    return this.prisma.bookmark.delete({
      where: { id },
    });
  }

  async moveBookmark(id: string, folderId: string): Promise<Bookmark> {
    const existingBookmark = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!existingBookmark) {
      throw Errors.BOOKMARK_NOT_FOUND(`Bookmark with id ${id} not found.`);
    }

    const destinationFolder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!destinationFolder) {
      throw Errors.FOLDER_NOT_FOUND(`Destination folder with id ${folderId} not found.`);
    }

    return this.prisma.bookmark.update({
      where: { id },
      data: { folderId },
    });
  }
}
