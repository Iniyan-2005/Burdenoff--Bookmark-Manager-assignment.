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
    createFolder: async (_parent: unknown, args: { input: { name: string } }, context: GraphQLContext) => {
      return context.folderService.createFolder(args.input.name);
    },
    createBookmark: async (_parent: unknown, args: { input: { title: string; url: string; tags?: string[] | null; folderId: string } }, context: GraphQLContext) => {
      return context.bookmarkService.createBookmark(args.input);
    },
    updateBookmark: async (_parent: unknown, args: { id: string; input: { title?: string | null; url?: string | null; tags?: string[] | null } }, context: GraphQLContext) => {
      return context.bookmarkService.updateBookmark(args.id, args.input);
    },
    deleteBookmark: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return context.bookmarkService.deleteBookmark(args.id);
    },
    moveBookmark: async (_parent: unknown, args: { id: string; folderId: string }, context: GraphQLContext) => {
      return context.bookmarkService.moveBookmark(args.id, args.folderId);
    },
  },
};
