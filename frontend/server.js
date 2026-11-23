const express = require("express");
const path = require("node:path");

const app = express();
const port = Number(process.env.FRONTEND_PORT || 5500);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("FRONTEND_PORT must be a number between 1 and 65535");
}

app.use("/images", express.static(path.resolve(__dirname, "../images")));
app.use(express.static(path.resolve(__dirname)));
app.listen(port, () => {
  console.log(`Frontend disponible en http://localhost:${port}`);
});
