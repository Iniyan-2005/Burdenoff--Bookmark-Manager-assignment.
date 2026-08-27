import { GraphQLError } from "graphql";

export const Errors = {
  INVALID_BOOKMARK_TITLE: (msg = "Bookmark title cannot be empty or whitespace.") =>
    new GraphQLError(msg, { extensions: { code: "INVALID_BOOKMARK_TITLE" } }),
  
  INVALID_BOOKMARK_URL: (msg = "Bookmark URL is malformed or invalid.") =>
    new GraphQLError(msg, { extensions: { code: "INVALID_BOOKMARK_URL" } }),
  
  BOOKMARK_NOT_FOUND: (msg = "Bookmark not found.") =>
    new GraphQLError(msg, { extensions: { code: "BOOKMARK_NOT_FOUND" } }),
  
  FOLDER_NOT_FOUND: (msg = "Folder not found.") =>
    new GraphQLError(msg, { extensions: { code: "FOLDER_NOT_FOUND" } }),

  INVALID_FOLDER_NAME: (msg = "Folder name cannot be empty or whitespace.") =>
    new GraphQLError(msg, { extensions: { code: "INVALID_FOLDER_NAME" } }),
};
