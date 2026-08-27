const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch(req) {
    return new Response("Bookmark Manager API is running!");
  },
});

console.log(`Listening on localhost:${server.port}`);
