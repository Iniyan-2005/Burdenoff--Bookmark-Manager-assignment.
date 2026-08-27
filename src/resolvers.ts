import { GraphQLContext } from "./context.js";

export const resolvers = {
  Query: {
    folders: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      return context.folderService.getFolders();
    },
    folder: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return context.folderService.getFolder(args.id);
    },
    bookmarks: async (_parent: unknown, args: { folderId?: string; search?: string; take?: number; cursor?: string }, context: GraphQLContext) => {
      return context.bookmarkService.getBookmarks(args);
    },
  },
  Folder: {
    bookmarks: async (parent: { id: string }, _args: unknown, context: GraphQLContext) => {
      return context.folderService.getFolderBookmarks(parent.id);
    }
  },
  Bookmark: {
    folder: async (parent: { folderId: string }, _args: unknown, context: GraphQLContext) => {
      return context.folderService.getFolder(parent.folderId);
    }
  },
  Mutation: {
    createFolder: (_parent: unknown, _args: { input: { name: string } }, _context: GraphQLContext) => {
      throw new Error("Not implemented");
    },
    createBookmark: (_parent: unknown, _args: { input: { title: string; url: string; tags?: string[]; folderId: string } }, _context: GraphQLContext) => {
      throw new Error("Not implemented");
    },
    updateBookmark: (_parent: unknown, _args: { id: string; input: { title?: string; url?: string; tags?: string[] } }, _context: GraphQLContext) => {
      throw new Error("Not implemented");
    },
    deleteBookmark: (_parent: unknown, _args: { id: string }, _context: GraphQLContext) => {
      throw new Error("Not implemented");
    },
    moveBookmark: (_parent: unknown, _args: { id: string; folderId: string }, _context: GraphQLContext) => {
      throw new Error("Not implemented");
    },
  },
};
