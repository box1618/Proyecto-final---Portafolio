const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const app = require("../dist/app").default;
const { UserModel } = require("../dist/models/User");
const { ArtworkModel } = require("../dist/models/Artwork");
const { createAuthToken } = require("../dist/utils/auth.util");

const testJwtSecret = "integration-test-secret-with-at-least-32-characters";
let server;
let baseUrl;
let artist;
let clientToken;

async function postJson(path, body, token) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

before(async () => {
  process.env.JWT_SECRET = testJwtSecret;
  if (process.env.TEST_MONGO_URI) {
    const testDatabase = new URL(process.env.TEST_MONGO_URI).pathname.slice(1);
    if (testDatabase !== "artfolio_test") {
      throw new Error("TEST_MONGO_URI must point to the dedicated artfolio_test database.");
    }

    await mongoose.connect(process.env.TEST_MONGO_URI);
    await mongoose.connection.dropDatabase();
    artist = await UserModel.create({
      name: "Integration Artist",
      email: "integration-artist@example.test",
      passwordHash: await bcrypt.hash("artist-password", 10),
      role: "artist",
      birthDate: new Date("1990-01-01T00:00:00.000Z")
    });
    process.env.ARTIST_USER_ID = artist.id;
  }

  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  await mongoose.disconnect();
});

test("health endpoint reports the API as available", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("commission creation rejects anonymous requests", async () => {
  const response = await postJson("/api/commissions", {
    title: "Test commission",
    description: "Test brief",
    service: "concept",
    tier: "1",
    licenses: []
  });
  assert.equal(response.status, 401);
});

test("artwork endpoint returns legacy Cloudinary images without a category", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const imageUrl = "https://res.cloudinary.com/example/image/upload/artfolio/test.png";
  await ArtworkModel.collection.insertOne({
    title: "Rendered artwork",
    artistId: "test-artist",
    description: "Test image",
    imageUrl,
    createdAt: new Date()
  });

  const response = await fetch(`${baseUrl}/api/artworks?category=art`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.artworks.length, 1);
  assert.equal(result.artworks[0].imageUrl, imageUrl);
});

test("registration validates age and never accepts a requested role", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const underage = await postJson("/api/users/register", {
    name: "Underage",
    email: "underage@example.test",
    password: "example-password",
    birthDate: "2015-01-01"
  });
  assert.equal(underage.status, 400);

  const registration = await postJson("/api/users/register", {
    name: "Integration Client",
    email: "integration-client@example.test",
    password: "example-password",
    birthDate: "2000-01-01",
    role: "admin"
  });
  assert.equal(registration.status, 201);
  const registered = await registration.json();
  assert.equal(registered.user.role, "client");
  assert.equal("passwordHash" in registered.user, false);
  assert.equal(typeof registered.token, "string");
  clientToken = registered.token;

  const duplicate = await postJson("/api/users/register", {
    name: "Duplicate",
    email: "integration-client@example.test",
    password: "example-password",
    birthDate: "2000-01-01"
  });
  assert.equal(duplicate.status, 409);

  const failedLogin = await postJson("/api/users/login", {
    email: "integration-client@example.test",
    password: "wrong-password"
  });
  assert.equal(failedLogin.status, 401);

  const login = await postJson("/api/users/login", {
    email: "integration-client@example.test",
    password: "example-password"
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.role, "client");
});

test("commission routes enforce roles and scope records to their owners", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const createdResponse = await postJson("/api/commissions", {
    title: "Test commission",
    description: "Test brief",
    service: "concept",
    tier: "1",
    licenses: ["commercial"]
  }, clientToken);
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()).commission;
  assert.equal(created.budget, 360);
  assert.equal(created.status, "pending");

  const clientList = await fetch(`${baseUrl}/api/commissions`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(clientList.status, 200);
  assert.equal((await clientList.json()).commissions.length, 1);

  const forbiddenUpdate = await fetch(`${baseUrl}/api/commissions/${created.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`
    },
    body: JSON.stringify({ status: "completed" })
  });
  assert.equal(forbiddenUpdate.status, 403);

  const artistToken = createAuthToken(artist.id);
  const artistList = await fetch(`${baseUrl}/api/commissions`, {
    headers: { Authorization: `Bearer ${artistToken}` }
  });
  assert.equal(artistList.status, 200);
  assert.equal((await artistList.json()).commissions.length, 1);

  const updated = await fetch(`${baseUrl}/api/commissions/${created.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${artistToken}`
    },
    body: JSON.stringify({ status: "completed" })
  });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).commission.status, "completed");
});
