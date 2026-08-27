# Project Walkthrough

## Bookmark Manager GraphQL API

For this assignment, I built a Bookmark Manager backend API using Bun, TypeScript, GraphQL Yoga, PostgreSQL, Prisma, and Docker.

The main goal was to build a small but properly structured backend rather than just making the API work. I focused on keeping the GraphQL layer separate from the business logic, handling validation properly, and making the project easy to run and understand.

---

## 1. Project Structure and Approach

I followed a schema-first GraphQL approach.

The GraphQL schema is defined in:

```text
src/schema.graphql
```

The resolvers are kept separately in:

```text
src/resolvers.ts
```

Instead of putting database logic directly inside the resolvers, the resolvers delegate the actual work to service classes:

```text
src/services/folder.service.ts
src/services/bookmark.service.ts
```

This keeps the responsibilities fairly simple:

- The GraphQL schema defines what the API supports.
- Resolvers connect GraphQL operations to the application logic.
- Services handle validation and database operations.
- Prisma handles communication with PostgreSQL.

I chose this structure because it felt appropriate for the size of the assignment. A more complex architecture with multiple repository layers or heavy abstractions would have added unnecessary complexity.

---

## 2. Database Design

The application uses PostgreSQL with Prisma as the ORM.

There are two main models:

- `Folder`
- `Bookmark`

A folder can contain multiple bookmarks, and every bookmark belongs to a folder.

The bookmark model also supports tags using PostgreSQL's string array support.

I also configured cascading deletes so that deleting a folder will automatically remove its associated bookmarks.

For local development, PostgreSQL runs through Docker Compose.

The database can be started with:

```bash
docker compose up -d
```

Then Prisma migrations can be applied using:

```bash
bun run gendb
```

---

## 3. GraphQL Features

The API supports the main operations needed for managing folders and bookmarks.

### Folder Queries

The API can:

- Fetch all folders.
- Fetch a folder by ID.
- Fetch the bookmarks inside a folder.

### Bookmark Queries

The `bookmarks` query supports:

- Fetching bookmarks.
- Filtering by `folderId`.
- Searching bookmarks by title.
- Cursor-based pagination.

The search is case-insensitive and uses Prisma filtering.

---

## 4. Bookmark Mutations

The API supports the following bookmark operations:

- Create a bookmark.
- Update a bookmark.
- Delete a bookmark.
- Move a bookmark to another folder.

There is also a mutation for creating folders.

Before performing database operations, the service layer checks for common invalid cases.

For example:

- Bookmark titles cannot be empty or contain only whitespace.
- Folder names cannot be empty or contain only whitespace.
- URLs are validated using the native `new URL()` constructor.
- Creating a bookmark checks whether the target folder exists.
- Updating, deleting, or moving a bookmark checks whether the bookmark exists.
- Moving a bookmark also checks whether the destination folder exists.

Instead of returning generic errors, I added centralized GraphQL errors with specific error codes such as:

```text
INVALID_BOOKMARK_TITLE
INVALID_BOOKMARK_URL
BOOKMARK_NOT_FOUND
FOLDER_NOT_FOUND
INVALID_FOLDER_NAME
```

This makes the API errors easier for clients to understand and handle.

---

## 5. Cursor-Based Pagination

One of the parts I paid more attention to was pagination.

The `bookmarks` query supports both:

```text
take
cursor
```

The cursor is based on the bookmark ID.

The implementation uses Prisma's native cursor functionality along with:

```text
skip: 1
```

when a cursor is provided, so the bookmark used as the cursor does not appear again on the next page.

To determine whether another page exists, the query fetches one extra record.

For example, if the requested limit is:

```text
take: 5
```

the database query fetches 6 records.

If there are more than 5 records, the extra record is removed from the response and:

```text
hasNextPage: true
```

is returned.

The results are ordered by:

```text
createdAt DESC
id DESC
```

Using `id` as a secondary sort helps keep the ordering deterministic, especially when multiple bookmarks have similar timestamps.

I also manually tested pagination across multiple pages to verify that records were not duplicated or skipped.

---

## 6. Validation and Error Handling

I added a central error file:

```text
src/errors.ts
```

This keeps GraphQL errors consistent across the application.

For example, invalid input is rejected before Prisma is called.

A whitespace-only title:

```text
"     "
```

will return an `INVALID_BOOKMARK_TITLE` error.

Similarly, malformed URLs return:

```text
INVALID_BOOKMARK_URL
```

This prevents invalid data from reaching the database and avoids exposing raw Prisma errors through the API.

---

## 7. Testing

The project includes both unit tests and an integration test.

### Unit Tests

The unit tests cover things like:

- Creating a folder.
- Creating a bookmark.
- Invalid bookmark titles.
- Invalid URLs.
- Bookmark not found cases.
- Folder not found cases.
- Moving a bookmark to a nonexistent folder.
- Search and filtering behavior.
- Pagination behavior.

The unit tests use mocked Prisma behavior so that validation and service logic can be tested independently.

### Integration Test

There is also a PostgreSQL integration test.

This test performs a full flow:

1. Create a folder.
2. Create a bookmark inside that folder.
3. Query the folder.
4. Query the nested bookmarks.
5. Verify the returned data.
6. Clean up the test data.

This helps verify that the application works with the actual database rather than only with mocked objects.

The complete test suite can be run with:

```bash
bun test
```

TypeScript checking can be run with:

```bash
bun run typecheck
```

For convenience, I also added:

```bash
bun run sanity
```

which runs the project's type checking and tests together.

---

## 8. Git History and Development Process

I tried to keep the Git history incremental instead of building everything and committing it at the end.

The project was developed in logical steps, including:

- Initial Bun and TypeScript setup.
- PostgreSQL and Prisma setup.
- GraphQL schema and server setup.
- Folder queries.
- Bookmark filtering and search.
- Bookmark mutations.
- Validation and structured errors.
- Cursor pagination.
- Unit tests.
- PostgreSQL integration testing.
- Documentation.
- Sanity checks.
- GitHub Actions CI.

This makes the development process easier to follow and shows how the project evolved over time.

---

## 9. CI

I also added a minimal GitHub Actions workflow.

It runs on pull requests and performs:

- Dependency installation.
- Database setup.
- Prisma migration and client generation.
- Type checking.
- Tests.

The workflow uses PostgreSQL as a GitHub Actions service so that the integration tests can run against a real database.

I intentionally kept the CI setup minimal and focused only on quality checks rather than adding unnecessary deployment steps.

---

## 10. Final Notes

Overall, my focus for this assignment was to build something that is small enough to stay simple but still follows a clean structure.

The main decisions I made were:

- Keep GraphQL schema, resolvers, and business logic separate.
- Use Prisma directly inside the service layer instead of adding unnecessary abstraction layers.
- Validate input before database operations.
- Return structured GraphQL error codes.
- Implement actual cursor-based pagination instead of offset pagination.
- Include both unit and integration testing.
- Keep the Git history incremental and meaningful.
- Add a small CI workflow to automatically run checks on pull requests.

If I were extending this further, I would look at adding authentication, authorization, more advanced search, caching or DataLoader patterns, and observability.

For the scope of this assignment, I focused on keeping the implementation clean, functional, and easy to understand.
