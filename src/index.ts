import { createYoga, createSchema } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolvers } from "./resolvers.js";
import { createContext } from "./context.js";

const typeDefs = readFileSync(join(process.cwd(), "src", "schema.graphql"), "utf-8");

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
  context: createContext,
});

const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch: yoga,
});

console.log(`Listening on http://localhost:${server.port}/graphql`);
