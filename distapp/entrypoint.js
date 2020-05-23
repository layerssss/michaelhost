const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

Promise.resolve()
  .then(async () => {
    const assetsDir = path.join(__dirname, "./assets");
    const tmpDir = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
    for (const file of fs.readdirSync(assetsDir)) {
      if (!file.match(/\.asset$/)) continue;
      const assetFile = path.join(assetsDir, file);
      const tmpFile = path.join(tmpDir, file.replace(/\.asset$/, ""));

      const readStream = fs.createReadStream(assetFile);
      readStream.pipe(fs.createWriteStream(tmpFile));
      await new Promise((resolve) => readStream.on("close", resolve));

      fs.chmodSync(tmpFile, "0700");
    }

    const child = spawn(
      path.join(tmpDir, "michaelhost_bin"),
      process.argv.slice(2),
      {
        argv0: process.argv0,
        windowsHide: true,
        stdio: "inherit",
      },
    );
    child.on("close", (code) => {
      for (const file of fs.readdirSync(tmpDir))
        fs.unlinkSync(path.join(tmpDir, file));
      fs.rmdirSync(tmpDir);
      process.exit(code);
    });
  })
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
