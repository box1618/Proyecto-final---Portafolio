process.env.JWT_SECRET = "e2e-test-secret-with-at-least-32-characters";
process.env.PORT = "3000";

const bcrypt = require("bcrypt");
const express = require("express");
const path = require("node:path");
const mongoose = require("mongoose");
const app = require("../dist/app").default;
const { UserModel } = require("../dist/models/User");
const serverClosers = [];

async function listen(server, name) {
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  serverClosers.push(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  console.log(`${name} listo.`);
}

async function start() {
  const mongoUri = process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/artfolio_e2e";
  const database = new URL(mongoUri).pathname.slice(1);
  if (database !== "artfolio_e2e") {
    throw new Error("E2E_MONGO_URI must point to the dedicated artfolio_e2e database.");
  }
  await mongoose.connect(mongoUri);
  await mongoose.connection.dropDatabase();
  const artist = await UserModel.create({
    name: "E2E Artist",
    email: "e2e-artist@example.test",
    passwordHash: await bcrypt.hash("e2e-artist-password", 10),
    role: "artist",
    birthDate: new Date("1990-01-01T00:00:00.000Z")
  });
  process.env.ARTIST_USER_ID = artist.id;

  const apiServer = app.listen(3000);
  await listen(apiServer, "API E2E");

  const frontend = express();
  frontend.use("/images", express.static(path.resolve(__dirname, "../../images")));
  frontend.use(express.static(path.resolve(__dirname, "../../frontend")));
  const frontendServer = frontend.listen(5500);
  await listen(frontendServer, "Frontend E2E");
}

async function shutdown() {
  for (const close of serverClosers.reverse()) {
    await close();
  }
  await mongoose.disconnect();
}

process.once("SIGINT", () => void shutdown().finally(() => process.exit(0)));
process.once("SIGTERM", () => void shutdown().finally(() => process.exit(0)));
process.once("uncaughtException", (error) => {
  console.error(error);
  void shutdown().finally(() => process.exit(1));
});

void start().catch((error) => {
  console.error("No se pudieron iniciar los servidores E2E:", error);
  void shutdown().finally(() => process.exit(1));
});
