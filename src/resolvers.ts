import { GraphQLContext } from "./context.js";

export const resolvers = {
  Query: {
    folders: (_parent: unknown, _args: unknown, _context: GraphQLContext) => {
      return [];
    },
    folder: (_parent: unknown, _args: { id: string }, _context: GraphQLContext) => {
      return null;
    },
    bookmarks: (_parent: unknown, _args: { folderId?: string; search?: string; take?: number; cursor?: string }, _context: GraphQLContext) => {
      return {
        nodes: [],
        endCursor: null,
        hasNextPage: false,
      };
    },
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
