import { PrismaClient, Prisma } from "@prisma/client";

export class BookmarkService {
  constructor(private prisma: PrismaClient) {}

  async getBookmarks(params: {
    folderId?: string | null;
    search?: string | null;
    take?: number | null;
    cursor?: string | null;
  }) {
    // Note: Cursor pagination is NOT implemented yet for Phase 5.
    // We only process folderId filtering and search filtering.

    const where: Prisma.BookmarkWhereInput = {};

    if (params.folderId) {
      where.folderId = params.folderId;
    }

    if (params.search && params.search.trim() !== "") {
      // Predictable search behavior: case-insensitive substring match against title.
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
}
