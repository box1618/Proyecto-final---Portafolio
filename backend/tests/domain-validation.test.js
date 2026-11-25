const assert = require("node:assert/strict");
const test = require("node:test");
const { parseAdultBirthDate } = require("../dist/utils/authValidation");
const { createAuthToken, verifyAuthToken } = require("../dist/utils/auth.util");
const { calculateCommissionQuote } = require("../dist/utils/commissionPricing");
const { validateServiceListingInput } = require("../dist/utils/serviceListingValidation");
const { UserModel } = require("../dist/models/User");

test("accepts a valid birth date when the user is at least 18", () => {
  const birthDate = parseAdultBirthDate("2008-11-22", new Date("2026-11-22T12:00:00.000Z"));
  assert.equal(birthDate.toISOString(), "2008-11-22T00:00:00.000Z");
});

test("rejects underage and impossible birth dates", () => {
  const now = new Date("2026-11-22T12:00:00.000Z");
  assert.equal(parseAdultBirthDate("2008-11-23", now), null);
  assert.equal(parseAdultBirthDate("2000-02-30", now), null);
});

test("calculates known package prices with selected licenses", () => {
  assert.equal(calculateCommissionQuote("concept", "1", ["commercial"]).budget, 360);
  assert.equal(calculateCommissionQuote("3d", "0", ["merchandising"]).budget, 450);
  assert.equal(calculateCommissionQuote("animation", "2", []).budget, 800);
});

test("rejects unknown services, packages, and licenses", () => {
  assert.equal(calculateCommissionQuote("unknown", "1", []), null);
  assert.equal(calculateCommissionQuote("concept", "4", []), null);
  assert.equal(calculateCommissionQuote("concept", "1", ["free"]), null);
  assert.equal(calculateCommissionQuote("concept", "1", ["commercial", "commercial"]), null);
});

test("validates editable service listings and their package prices", () => {
  const listing = {
    slug: "portrait-commission",
    category: "Illustration",
    title: "Portrait",
    description: "Custom portrait commission",
    rules: ["Two revisions included"],
    images: ["https://res.cloudinary.com/example/image/upload/portrait.png"],
    packages: [{
      name: "Color",
      description: "Full color portrait",
      price: 85,
      deliveryDays: 7,
      included: "One character and two revisions"
    }],
    active: true,
    displayOrder: 1
  };

  const valid = validateServiceListingInput(listing, true);
  assert.equal("value" in valid, true);
  assert.equal(valid.value.packages[0].price, 85);

  const invalidPrice = validateServiceListingInput({
    ...listing,
    packages: [{ ...listing.packages[0], price: -10 }]
  }, true);
  assert.equal("error" in invalidPrice, true);

  const invalidSlug = validateServiceListingInput({
    ...listing,
    slug: "../portrait"
  }, true);
  assert.equal("error" in invalidSlug, true);
});

test("artist profile fields have no database defaults on new users", () => {
  for (const field of ["handle", "artistTitle", "bio", "responseTime"]) {
    assert.equal(UserModel.schema.path(field).options.default, undefined);
  }
});

test("issues valid JWTs and rejects invalid tokens", () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-secret-value-that-is-at-least-32-characters";
  try {
    const userId = "507f1f77bcf86cd799439011";
    const token = createAuthToken(userId);
    assert.equal(verifyAuthToken(token), userId);
    assert.equal(verifyAuthToken("not-a-token"), null);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
