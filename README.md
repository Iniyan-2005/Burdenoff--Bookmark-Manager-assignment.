# Bookmark Manager GraphQL API

## Overview
A clean, robust GraphQL API for managing folders and bookmarks. This project is built schema-first, emphasizing strict typing, minimal dependencies, and solid database foundations over complex abstractions.

## Tech Stack
* **Bun**: Blazing fast JavaScript runtime, bundler, and test runner.
* **TypeScript**: Strict mode enabled to guarantee end-to-end type safety.
* **GraphQL Yoga**: A fully-featured, simple, and lightweight GraphQL server.
* **PostgreSQL**: Robust relational database running locally via Docker.
* **Prisma**: Next-generation Node.js and TypeScript ORM.
* **Docker Compose**: Container orchestration for local database provisioning.

## Setup
To set up the project locally from scratch, ensure you have Bun and Docker installed. Then, run the following commands:

```bash
# 1. Start the local PostgreSQL database
docker compose up -d

# 2. Install dependencies
bun install

# 3. Apply database migrations and generate the Prisma Client
bun run gendb

# 4. Start the development server
bun run dev
```
The server will start at `http://localhost:3000/graphql`.

## Environment Variables
The project uses `.env` for local configuration. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```
**Required Variables:**
- `PORT`: The port the server runs on (defaults to 3000).
- `DATABASE_URL`: The connection string for PostgreSQL (e.g. `postgresql://postgres:password@localhost:5433/bookmark_manager?schema=public`).

## Database
- **PostgreSQL Docker setup**: Configured in `docker-compose.yml`, spinning up a `postgres:15-alpine` instance with a persisted volume.
- **Prisma**: The schema is defined in `prisma/schema.prisma`. It features cascading deletes and strategic indexing on `folderId` and `createdAt`.
- **Migrations**: Controlled via the `bun run gendb` script (`prisma migrate dev`), keeping the schema synchronized with the database state safely.
- **Prisma Client Generation**: Handled automatically during migrations, exporting a heavily typed Prisma Client to `node_modules`.

## Running Tests
We use `bun test` natively. The test suite avoids relying on fake assertions, offering genuine verifications.

- **Unit Tests**: Employs mocked Prisma contexts to guarantee resolver boundary integrity and validation rejection before reaching the DB.
- **Integration Tests**: Connects safely to the active PostgreSQL database, spinning up disposable test records to verify complex relational fetches without permanently polluting the development environment.
- **Complete Test Suite**:
  ```bash
  bun test
  ```
- **Type Checking**:
  ```bash
  bun run typecheck
  ```

## GraphQL API

### Queries

#### `folders`
Returns a list of all folders, ordered by creation date.
```graphql
query {
  folders {
    id
    name
  }
}
```

#### `folder(id: ID!)`
Returns a specific folder and nested bookmarks. Throws `FOLDER_NOT_FOUND` if nonexistent.
```graphql
query {
  folder(id: "uuid") {
    id
    name
    bookmarks {
      title
      url
    }
  }
}
```

#### `bookmarks(folderId: ID, search: String, take: Int, cursor: String)`
Returns a paginated list of bookmarks. Supports folder isolation and case-insensitive substring search.
```graphql
query {
  bookmarks(folderId: "uuid", search: "react", take: 10) {
    nodes {
      title
      url
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

### Mutations

#### `createFolder`
Creates a folder.
```graphql
mutation {
  createFolder(input: { name: "Web Dev" }) {
    id
    name
  }
}
```

#### `createBookmark`
Creates a bookmark. Rejects if the folder doesn't exist.
```graphql
mutation {
  createBookmark(input: { title: "GitHub", url: "https://github.com", tags: ["dev"], folderId: "uuid" }) {
    id
    title
  }
}
```

#### `updateBookmark`
Partially updates a bookmark.
```graphql
mutation {
  updateBookmark(id: "uuid", input: { title: "GitHub Updated" }) {
    id
    title
  }
}
```

#### `deleteBookmark`
Deletes a bookmark and returns it.
```graphql
mutation {
  deleteBookmark(id: "uuid") {
    id
  }
}
```

#### `moveBookmark`
Reassigns a bookmark to a new folder.
```graphql
mutation {
  moveBookmark(id: "uuid", folderId: "new-folder-uuid") {
    id
    folder {
      name
    }
  }
}
```

## Pagination
We use **genuine cursor-based pagination** backed by Prisma.
- **What cursor represents**: It represents the unique `id` of a bookmark.
- **How take works**: Dictates the limit of records returned on the current page (defaults to 50).
- **How endCursor is used**: The client passes the `endCursor` into the subsequent request's `cursor` argument. The server uses `skip: 1` to skip the cursor element itself.
- **How hasNextPage works**: We secretly fetch `take + 1` items. If the returned array size exceeds `take`, `hasNextPage` evaluates to `true`.
- **Ordering strategy**: Results are sorted predictably by `[{ createdAt: 'desc' }, { id: 'desc' }]`. This strictly avoids skipping or duplicating records even if multiple items share the exact same timestamp.

## Validation and Errors
- **Title Validation**: Bookmark and folder titles explicitly reject empty strings (`""`) and whitespace-only strings. Valid payloads are securely trimmed before database storage.
- **URL Validation**: Employs the native `new URL()` constructor to accurately isolate and reject invalid or malformed formats.
- **Meaningful Errors**: The system implements a central dictionary mapping to specific `GraphQLError` extensions (`INVALID_BOOKMARK_TITLE`, `INVALID_BOOKMARK_URL`, `FOLDER_NOT_FOUND`, `BOOKMARK_NOT_FOUND`, `INVALID_FOLDER_NAME`). Invalid inputs safely terminate the request before bleeding into Prisma, completely eliminating obscure HTTP 500 crashes and internal DB constraint leaks.

## Project Structure
- `src/index.ts`: The primary entry point instantiating GraphQL Yoga.
- `src/schema.graphql`: The definitive single-source-of-truth schema layout.
- `src/resolvers.ts`: The schema's resolver map, delegating tasks strictly to underlying services.
- `src/context.ts`: The injection container bridging the Prisma client and service layer across resolvers.
- `src/services/`: Core business logic and validation boundaries.
- `src/errors.ts`: Unified GraphQL error definitions.
- `src/__tests__/`: Unit and integration testing suites.
- `prisma/`: Prisma schema layout and migration artifacts.

## How I'd Extend This
While intentionally simplistic, a production-scale deployment would expand natively into:
- **Authentication**: Implementing JWT middleware at the Yoga context level.
- **Authorization**: Row-level security limiting users to edit only their personally owned folders/bookmarks.
- **Caching**: Wrapping aggressive queries (like `folder(id)`) in a Redis caching layer or implementing standard DataLoader patterns to batch query resolutions.
- **Improved search**: Replacing standard `ILIKE` substrings with PostgreSQL Full-Text Search (`tsvector`) or Elasticsearch for rapid typo-tolerant indexing.
- **Observability**: Exposing tracing plugins (e.g. Apollo Tracing/Datadog) within GraphQL Yoga to measure individual resolver execution times natively.
- **Scaling**: Migrating to a scalable cloud infrastructure with PgBouncer for optimal Postgres connection pooling.
- **API versioning**: Evolving the schema cautiously through `@deprecated` tags to maintain backward compatibility.

## Tradeoffs
- **Minimal Abstraction**: A complex Domain-Driven Design (DDD) layout was deliberately avoided. Controllers/repositories were streamlined into a single Service layer to maximize legibility.
- **Cursor Generation**: While an opaque base64-encoded cursor is considered a GraphQL standard, the raw UUID was exposed explicitly for the cursor to drastically simplify debugging without degrading functionality.
- **Field Resolvers vs Included Fetching**: Database inclusion (`include: { bookmarks: true }`) was heavily avoided in queries to prevent excessive DB fetching when clients intentionally omit sub-fields, leaning strictly into scalable GraphQL field resolvers.
