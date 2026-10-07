const { spawn } = require("node:child_process");
const path = require("node:path");
const { disposableDatabase } = require("../test/helpers/database");
const { createApp } = require("../app");
(async () => {
  const fixture = await disposableDatabase("browser");
  const server = createApp(fixture.db, {
    weather: async () => ({
      available: false,
      message:
        "Weather is temporarily unavailable. You can still register for this event.",
    }),
  }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.env.PYTHON || "python3",
        [path.join(__dirname, "../../tests/browser_test.py")],
        {
          cwd: path.join(__dirname, "../.."),
          env: {
            ...process.env,
            BASE_URL: `http://127.0.0.1:${server.address().port}`,
            QA_OUTPUT: "tmp/a3-qa",
          },
          stdio: "inherit",
        },
      );
      child.on("error", reject);
      child.on("exit", resolve);
    });
    process.exitCode = code || 0;
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await fixture.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
