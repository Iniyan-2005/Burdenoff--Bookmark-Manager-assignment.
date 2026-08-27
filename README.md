# Burdenoff Bookmark Manager - GraphQL API

## Setup
(To be documented)

## Environment variables
(To be documented)

## PostgreSQL setup
(To be documented)

## Prisma migrations
(To be documented)

## Running server
(To be documented)

## Running tests
(To be documented)

## GraphQL API documentation
(To be documented)

## Pagination approach
We use a **genuine cursor-based pagination** approach backed by Prisma.
- **Cursor Generation**: The `endCursor` returned in `pageInfo` is the unique `id` of the last item on the page.
- **Querying Next Page**: When the client passes the `cursor` argument, we use Prisma's `cursor` option to find that record and apply `skip: 1` to skip the cursor element itself.
- **Deterministic Ordering**: Results are sorted predictably by `[{ createdAt: 'desc' }, { id: 'desc' }]`. This ensures consistent pagination across pages even for records created at the exact same millisecond.
- **Next Page Calculation**: We query for `take + 1` records. If the returned set size exceeds `take`, we know there is a next page, set `hasNextPage = true`, and slice off the extra record before returning `nodes`.

## How I'd Extend This
(To be documented)

## Important design decisions/tradeoffs
(To be documented)
