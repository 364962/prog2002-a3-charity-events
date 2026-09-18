const pool = require("./event_db");
const { createApp } = require("./app");

const port = Number(process.env.PORT || 3088);
const host = process.env.HOST || "127.0.0.1";
let server;

async function start() {
  try {
    await pool.execute("SELECT 1");
    server = createApp().listen(port, host, () => {
      console.log(`Good Together is running at http://${host}:${port}`);
    });
    server.on("error", async (error) => {
      console.error("Server could not start:", error.code);
      await pool.end();
      process.exitCode = 1;
    });
  } catch (error) {
    console.error(
      "Database unavailable. Check api/.env and import the SQL file.",
      error.code,
    );
    await pool.end();
    process.exitCode = 1;
  }
}

function shutdown() {
  if (!server) return;
  server.close(async () => {
    await pool.end();
  });
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
start();
