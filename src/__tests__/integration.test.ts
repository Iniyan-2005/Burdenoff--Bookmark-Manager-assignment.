import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { PrismaClient, Folder, Bookmark } from "@prisma/client";
import { resolvers } from "../resolvers.js";
import { FolderService } from "../services/folder.service.js";
import { BookmarkService } from "../services/bookmark.service.js";
import { GraphQLContext } from "../context.js";

const prisma = new PrismaClient();
const context: GraphQLContext = {
  prisma,
  folderService: new FolderService(prisma),
  bookmarkService: new BookmarkService(prisma),
};

describe("PostgreSQL Integration Tests", () => {
  let testFolderId: string;
  let testBookmarkId: string;

  beforeAll(async () => {
    // Ensure we start with a clean slate for integration tests
    await prisma.bookmark.deleteMany({ where: { title: "Integration Test Bookmark" } });
    await prisma.folder.deleteMany({ where: { name: "Integration Test Folder" } });
  });

  afterAll(async () => {
    // Clean up test data to prevent database pollution
    await prisma.bookmark.deleteMany({ where: { title: "Integration Test Bookmark" } });
    await prisma.folder.deleteMany({ where: { name: "Integration Test Folder" } });
    await prisma.$disconnect();
  });

  test("End-to-End: Create Folder, Create Bookmark, and Query", async () => {
    // 1. Create a folder
    const folderRes = await resolvers.Mutation.createFolder(
      {},
      { input: { name: "Integration Test Folder" } },
      context
    ) as Folder;
    
    expect(folderRes).toBeDefined();
    expect(folderRes.id).toBeDefined();
    expect(folderRes.name).toBe("Integration Test Folder");
    testFolderId = folderRes.id;

    // 2. Create a bookmark in that folder
    const bookmarkRes = await resolvers.Mutation.createBookmark(
      {},
      {
        input: {
          title: "Integration Test Bookmark",
          url: "https://integration.test.com",
          folderId: testFolderId,
        },
      },
      context
    ) as Bookmark;

    expect(bookmarkRes).toBeDefined();
    expect(bookmarkRes.id).toBeDefined();
    expect(bookmarkRes.title).toBe("Integration Test Bookmark");
    expect(bookmarkRes.url).toBe("https://integration.test.com");
    expect(bookmarkRes.folderId).toBe(testFolderId);
    testBookmarkId = bookmarkRes.id;

    // 3. Query the folder
    const fetchedFolder = await resolvers.Query.folder(
      {},
      { id: testFolderId },
      context
    ) as Folder;
    
    expect(fetchedFolder).toBeDefined();
    expect(fetchedFolder.id).toBe(testFolderId);
    expect(fetchedFolder.name).toBe("Integration Test Folder");

    // 4. Query nested bookmarks via the field resolver
    const fetchedBookmarks = await resolvers.Folder.bookmarks(
      { id: testFolderId },
      {},
      context
    ) as Bookmark[];

    expect(fetchedBookmarks.length).toBe(1);
    expect(fetchedBookmarks[0].id).toBe(testBookmarkId);
    expect(fetchedBookmarks[0].title).toBe("Integration Test Bookmark");
    expect(fetchedBookmarks[0].folderId).toBe(testFolderId);
  });
});
