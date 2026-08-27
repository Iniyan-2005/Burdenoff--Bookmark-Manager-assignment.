import { expect, test, describe, mock, beforeEach } from "bun:test";
import { resolvers } from "../resolvers.js";
import { GraphQLContext } from "../context.js";
import { FolderService } from "../services/folder.service.js";
import { BookmarkService } from "../services/bookmark.service.js";
import { PrismaClient, Folder, Bookmark } from "@prisma/client";
import { GraphQLError } from "graphql";

describe("GraphQL Resolvers & Services", () => {
  const createFolderMock = mock();
  const findUniqueFolderMock = mock();
  const findManyFolderMock = mock();
  const createBookmarkMock = mock();
  const findUniqueBookmarkMock = mock();
  const updateBookmarkMock = mock();
  const deleteBookmarkMock = mock();
  const findManyBookmarkMock = mock();

  const mockPrisma = {
    folder: {
      create: createFolderMock,
      findUnique: findUniqueFolderMock,
      findMany: findManyFolderMock,
    },
    bookmark: {
      create: createBookmarkMock,
      findUnique: findUniqueBookmarkMock,
      update: updateBookmarkMock,
      delete: deleteBookmarkMock,
      findMany: findManyBookmarkMock,
    },
  } as unknown as PrismaClient;

  const context: GraphQLContext = {
    prisma: mockPrisma,
    folderService: new FolderService(mockPrisma),
    bookmarkService: new BookmarkService(mockPrisma),
  };

  beforeEach(() => {
    createFolderMock.mockClear();
    findUniqueFolderMock.mockClear();
    findManyFolderMock.mockClear();
    createBookmarkMock.mockClear();
    findUniqueBookmarkMock.mockClear();
    updateBookmarkMock.mockClear();
    deleteBookmarkMock.mockClear();
    findManyBookmarkMock.mockClear();
  });

  test("1. createFolder success", async () => {
    createFolderMock.mockResolvedValueOnce({ id: "folder-1", name: "Test Folder", createdAt: new Date() } as Folder);
    const result = await resolvers.Mutation.createFolder({}, { input: { name: "Test Folder" } }, context) as Folder;
    
    expect(result.id).toBe("folder-1");
    expect(result.name).toBe("Test Folder");
    expect(createFolderMock).toHaveBeenCalledTimes(1);
  });

  test("2. createBookmark success", async () => {
    findUniqueFolderMock.mockResolvedValueOnce({ id: "folder-1", name: "Test Folder", createdAt: new Date() } as Folder);
    createBookmarkMock.mockResolvedValueOnce({
      id: "bm-1",
      title: "Google",
      url: "https://google.com",
      tags: [],
      folderId: "folder-1",
      createdAt: new Date(),
    } as Bookmark);

    const result = await resolvers.Mutation.createBookmark(
      {},
      { input: { title: "Google", url: "https://google.com", folderId: "folder-1" } },
      context
    ) as Bookmark;

    expect(result.id).toBe("bm-1");
    expect(result.title).toBe("Google");
    expect(createBookmarkMock).toHaveBeenCalledTimes(1);
    expect(findUniqueFolderMock).toHaveBeenCalledTimes(1);
  });

  test("3. invalid bookmark title", async () => {
    try {
      await resolvers.Mutation.createBookmark(
        {},
        { input: { title: "   ", url: "https://google.com", folderId: "folder-1" } },
        context
      );
      expect(true).toBe(false);
    } catch (e: unknown) {
      expect(e instanceof GraphQLError).toBe(true);
      expect((e as GraphQLError).extensions.code).toBe("INVALID_BOOKMARK_TITLE");
    }
    // Prisma shouldn't be called if validation fails
    expect(createBookmarkMock).toHaveBeenCalledTimes(0);
  });

  test("4. invalid bookmark URL", async () => {
    try {
      await resolvers.Mutation.createBookmark(
        {},
        { input: { title: "Valid", url: "not-a-url", folderId: "folder-1" } },
        context
      );
      expect(true).toBe(false);
    } catch (e: unknown) {
      expect(e instanceof GraphQLError).toBe(true);
      expect((e as GraphQLError).extensions.code).toBe("INVALID_BOOKMARK_URL");
    }
  });

  test("5. bookmark not found (updateBookmark)", async () => {
    findUniqueBookmarkMock.mockResolvedValueOnce(null);
    try {
      await resolvers.Mutation.updateBookmark(
        {},
        { id: "nonexistent", input: { title: "Updated" } },
        context
      );
      expect(true).toBe(false);
    } catch (e: unknown) {
      expect(e instanceof GraphQLError).toBe(true);
      expect((e as GraphQLError).extensions.code).toBe("BOOKMARK_NOT_FOUND");
    }
  });

  test("6. folder not found (createBookmark)", async () => {
    // Return null when searching for folder
    findUniqueFolderMock.mockResolvedValueOnce(null);
    try {
      await resolvers.Mutation.createBookmark(
        {},
        { input: { title: "Valid", url: "https://example.com", folderId: "nonexistent" } },
        context
      );
      expect(true).toBe(false);
    } catch (e: unknown) {
      expect(e instanceof GraphQLError).toBe(true);
      expect((e as GraphQLError).extensions.code).toBe("FOLDER_NOT_FOUND");
    }
  });

  test("7. moveBookmark to nonexistent folder", async () => {
    // Bookmark exists
    findUniqueBookmarkMock.mockResolvedValueOnce({ id: "bm-1", title: "Test", folderId: "f-1" } as Bookmark);
    // Destination folder doesn't exist
    findUniqueFolderMock.mockResolvedValueOnce(null);

    try {
      await resolvers.Mutation.moveBookmark(
        {},
        { id: "bm-1", folderId: "nonexistent" },
        context
      );
      expect(true).toBe(false);
    } catch (e: unknown) {
      expect(e instanceof GraphQLError).toBe(true);
      expect((e as GraphQLError).extensions.code).toBe("FOLDER_NOT_FOUND");
    }
  });

  test("8. bookmark filtering/search", async () => {
    const mockNodes = [
      { id: "1", title: "React Docs" } as Bookmark,
      { id: "2", title: "Vue Docs" } as Bookmark,
    ];
    findManyBookmarkMock.mockResolvedValueOnce(mockNodes);

    const result = await resolvers.Query.bookmarks(
      {},
      { search: "docs" },
      context
    ) as { nodes: Bookmark[], pageInfo: { endCursor: string | null, hasNextPage: boolean } };

    expect(result.nodes.length).toBe(2);
    expect(result.nodes[0].title).toBe("React Docs");
    expect(findManyBookmarkMock).toHaveBeenCalledTimes(1);
    
    // Verify that the search filter was correctly passed to Prisma
    const callArgs = findManyBookmarkMock.mock.calls[0][0];
    expect(callArgs.where.title.contains).toBe("docs");
    expect(callArgs.where.title.mode).toBe("insensitive");
  });

  test("9. pagination behavior (hasNextPage)", async () => {
    // If limit is 50, and Prisma returns 51 records, hasNextPage should be true.
    const mockNodes = Array.from({ length: 51 }).map((_, i) => ({ id: `bm-${i}`, title: `Title ${i}` } as Bookmark));
    findManyBookmarkMock.mockResolvedValueOnce(mockNodes);

    const result = await resolvers.Query.bookmarks(
      {},
      { take: 50 },
      context
    ) as { nodes: Bookmark[], pageInfo: { endCursor: string | null, hasNextPage: boolean } };

    // Should return only 50 records
    expect(result.nodes.length).toBe(50);
    // hasNextPage should be true
    expect(result.pageInfo.hasNextPage).toBe(true);
    // endCursor should be the id of the 50th item
    expect(result.pageInfo.endCursor).toBe("bm-49");
  });

  test("9. pagination behavior (last page)", async () => {
    // If limit is 50, and Prisma returns exactly 50 records, hasNextPage should be false.
    const mockNodes = Array.from({ length: 50 }).map((_, i) => ({ id: `bm-${i}`, title: `Title ${i}` } as Bookmark));
    findManyBookmarkMock.mockResolvedValueOnce(mockNodes);

    const result = await resolvers.Query.bookmarks(
      {},
      { take: 50 },
      context
    ) as { nodes: Bookmark[], pageInfo: { endCursor: string | null, hasNextPage: boolean } };

    // Should return 50 records
    expect(result.nodes.length).toBe(50);
    // hasNextPage should be false
    expect(result.pageInfo.hasNextPage).toBe(false);
  });
});
