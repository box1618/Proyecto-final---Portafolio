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
let serviceListing;

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

test("service management endpoints reject requests without a token", async () => {
  const listResponse = await fetch(`${baseUrl}/api/services/manage`);
  assert.equal(listResponse.status, 401);

  const createResponse = await postJson("/api/services", {});
  assert.equal(createResponse.status, 401);

  const uploadResponse = await postJson("/api/services/images", {});
  assert.equal(uploadResponse.status, 401);
});

test("profile reads are not counted against the login rate limit", async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/users/me`);
    assert.equal(response.status, 401);
  }
});

test("avatar upload requires an authenticated account", async () => {
  const response = await postJson("/api/users/me/avatar", {});
  assert.equal(response.status, 401);
});

test("artist avatar uploads reach file validation", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const formData = new FormData();
  formData.append("avatar", new Blob(["not an image"], { type: "text/plain" }), "avatar.txt");

  const response = await fetch(`${baseUrl}/api/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${createAuthToken(artist.id)}` },
    body: formData
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /JPG, PNG, WebP o GIF/);
});

test("only artists and admins can upload a profile banner", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const client = await UserModel.create({
    name: "Banner Client",
    email: "banner-client@example.test",
    passwordHash: "unused-test-password",
    role: "client"
  });
  const artistForm = new FormData();
  artistForm.append("banner", new Blob(["not an image"], { type: "text/plain" }), "banner.txt");
  const artistResponse = await fetch(`${baseUrl}/api/users/me/banner`, {
    method: "POST",
    headers: { Authorization: `Bearer ${createAuthToken(artist.id)}` },
    body: artistForm
  });
  assert.equal(artistResponse.status, 400);
  assert.match((await artistResponse.json()).error, /JPG, PNG, WebP o GIF/);

  const clientForm = new FormData();
  clientForm.append("banner", new Blob(["not an image"], { type: "text/plain" }), "banner.txt");
  const clientResponse = await fetch(`${baseUrl}/api/users/me/banner`, {
    method: "POST",
    headers: { Authorization: `Bearer ${createAuthToken(client.id)}` },
    body: clientForm
  });
  assert.equal(clientResponse.status, 403);
});

test("artist public profile includes its saved banner URL", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const bannerUrl = "https://res.cloudinary.com/example/image/upload/artfolio/banners/test.png";
  await UserModel.findByIdAndUpdate(artist.id, { $set: { bannerUrl } });

  const response = await fetch(`${baseUrl}/api/users/${artist.id}`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.bannerUrl, bannerUrl);
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
  const clientDocument = await UserModel.findOne({ email: "integration-client@example.test" }).lean();
  for (const field of ["handle", "artistTitle", "bio", "responseTime"]) {
    assert.equal(Object.hasOwn(clientDocument, field), false);
  }

  const clientProfileUpdate = await fetch(`${baseUrl}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`
    },
    body: JSON.stringify({
      name: "Integration Client",
      handle: "cliente-cc",
      bio: "Perfil privado del cliente"
    })
  });
  assert.equal(clientProfileUpdate.status, 200);
  const updatedClient = (await clientProfileUpdate.json()).user;
  assert.equal(updatedClient.handle, "cliente-cc");
  assert.equal(updatedClient.bio, "Perfil privado del cliente");
  assert.equal("artistTitle" in updatedClient, false);

  const forbiddenProfessionalUpdate = await fetch(`${baseUrl}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`
    },
    body: JSON.stringify({
      name: "Integration Client",
      artistTitle: "Artist"
    })
  });
  assert.equal(forbiddenProfessionalUpdate.status, 403);

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

test("artists can create and edit service listings while clients cannot", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const listing = {
    slug: "integration-portrait",
    category: "Illustration",
    title: "Portrait commission",
    description: "An editable illustration service.",
    rules: ["One revision included."],
    images: [],
    packages: [{
      name: "Color",
      description: "Full color portrait.",
      price: 85,
      deliveryDays: 7,
      included: "One character."
    }],
    active: true,
    displayOrder: 0
  };
  const clientCreate = await postJson("/api/services", listing, clientToken);
  assert.equal(clientCreate.status, 403);
  const clientManage = await fetch(`${baseUrl}/api/services/manage`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  assert.equal(clientManage.status, 403);

  const artistToken = createAuthToken(artist.id);
  const createResponse = await postJson("/api/services", listing, artistToken);
  assert.equal(createResponse.status, 201);
  serviceListing = (await createResponse.json()).service;

  const publicResponse = await fetch(`${baseUrl}/api/services/${listing.slug}`);
  assert.equal(publicResponse.status, 200);
  assert.equal((await publicResponse.json()).service.packages[0].price, 85);

  const updateResponse = await fetch(`${baseUrl}/api/services/${serviceListing._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${artistToken}`
    },
    body: JSON.stringify({ ...listing, title: "Updated portrait", packages: [{ ...listing.packages[0], price: 95 }] })
  });
  assert.equal(updateResponse.status, 200);
  serviceListing = (await updateResponse.json()).service;
  assert.equal(serviceListing.packages[0].price, 95);
});

test("artist username updates are persisted in MongoDB", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const artistToken = createAuthToken(artist.id);
  const response = await fetch(`${baseUrl}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${artistToken}`
    },
    body: JSON.stringify({
      name: "Integration Artist",
      handle: "cc",
      artistTitle: "Digital artist",
      bio: "Integration test profile",
      responseTime: "Two days"
    })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.handle, "cc");

  const persistedArtist = await UserModel.findById(artist.id).lean();
  assert.equal(persistedArtist.handle, "cc");
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

test("catalog commission uses the stored package price instead of a client price", { skip: !process.env.TEST_MONGO_URI }, async () => {
  const packageId = serviceListing.packages[0]._id;
  const response = await postJson("/api/commissions", {
    listingId: serviceListing._id,
    packageId,
    description: "Please create a custom portrait.",
    price: 1
  }, clientToken);
  assert.equal(response.status, 201);
  const commission = (await response.json()).commission;
  assert.equal(commission.budget, 95);
  assert.equal(commission.title, "Updated portrait");
});
