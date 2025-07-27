import index from "./index.html";
const PORT = 3000;
// serve /main/index.html
Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  routes: {
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`Server is running on port ${PORT}`);
console.log(`http://localhost:${PORT}`);
