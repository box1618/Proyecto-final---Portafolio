const { expect, test } = require("@playwright/test");

test("edit controls are hidden for visitors", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page.locator("#edit-profile-button")).toBeHidden();
  await expect(page.locator("#manage-services-button")).toBeHidden();
});

test("admin signs in to the artist storefront instead of the client dashboard", async ({ page }) => {
  await page.route("**/api/users/login", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      user: { id: "admin-test", role: "admin" },
      token: "admin-test-token"
    })
  }));

  await page.goto("/pages/login.html?returnTo=client-dashboard.html");
  await page.locator("#email").fill("admin@example.test");
  await page.locator("#password").fill("example-password");
  await page.getByRole("button", { name: /Iniciar sesión en el portal/ }).click();

  await expect(page).toHaveURL(/index\.html$/);
});

test("artist can create a service that is published in the public catalog", async ({ page }) => {
  await page.goto("/pages/login.html");
  await page.locator("#email").fill("e2e-artist@example.test");
  await page.locator("#password").fill("e2e-artist-password");
  await page.getByRole("button", { name: /Iniciar sesión en el portal/ }).click();
  await expect(page).toHaveURL(/index\.html$/);
  await expect(page.locator("#manage-services-button")).toBeVisible();
  await page.locator("#manage-services-button").click();
  await expect(page).toHaveURL(/manage-services\.html$/);
  await expect(page.locator(".service-item")).toContainText("E2E Starter Service");

  await page.locator("#service-slug").fill("e2e-new-service");
  await page.locator("#service-category").fill("Diseño");
  await page.locator("#service-title").fill("Servicio creado desde el panel");
  await page.locator("#service-description").fill("Descripción pública de prueba.");
  await page.locator("#service-rules").fill("Regla de prueba");
  await page.locator('[data-package-field="name"]').fill("Paquete Básico");
  await page.locator('[data-package-field="price"]').fill("55");
  await page.locator('[data-package-field="description"]').fill("Paquete de prueba.");
  await page.locator('[data-package-field="deliveryDays"]').fill("5");
  await page.locator('[data-package-field="included"]').fill("Una entrega");
  await page.getByRole("button", { name: "Guardar servicio" }).click();
  await expect(page.locator(".service-item")).toContainText("Servicio creado desde el panel");

  await page.goto("/index.html");
  await expect(page.locator("#commission-list")).toContainText("Servicio creado desde el panel");
  await page.locator('a[href="pages/service.html?slug=e2e-new-service"]').click();
  await expect(page.locator("#service-title")).toHaveText("Servicio creado desde el panel");
  await expect(page.locator(".package-choice")).toContainText("$55.00 USD");
});

test("client registers, signs in, and submits a commission", async ({ page }) => {
  const email = `client-${Date.now()}@example.test`;

  await page.goto("/pages/register.html");
  await page.locator("#username").fill("E2E Client");
  await page.locator("#email").fill(email);
  await page.locator("#birth-day").fill("1");
  await page.locator("#birth-month").selectOption("01");
  await page.locator("#birth-year").fill("2000");
  await page.locator("#password").fill("example-password");
  await page.locator("#confirm-password").fill("example-password");
  await page.locator("#terms").check();
  await page.getByRole("button", { name: /Completar registro/ }).click();
  await expect(page).toHaveURL(/login\.html\?registered=1$/);

  await page.locator("#email").fill(email);
  await page.locator("#password").fill("example-password");
  await page.getByRole("button", { name: /Iniciar sesión en el portal/ }).click();
  await expect(page).toHaveURL(/client-dashboard\.html$/);
  await expect(page.locator("#client-name")).toHaveText("E2E Client");
  await expect(page.locator("#client-profile")).toBeHidden();

  await page.getByRole("button", { name: "Editar perfil" }).click();
  await expect(page.locator("#client-profile")).toBeVisible();
  await page.locator("#profile-handle").fill("e2e-client");
  await page.locator("#profile-bio").fill("Perfil de cliente de prueba.");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.locator("#client-profile-status")).toHaveText("Perfil actualizado.");
  await page.reload();
  await expect(page.locator("#client-profile")).toBeHidden();
  await page.getByRole("button", { name: "Editar perfil" }).click();
  await expect(page.locator("#profile-handle")).toHaveValue("e2e-client");
  await expect(page.locator("#profile-bio")).toHaveValue("Perfil de cliente de prueba.");

  await page.goto("/index.html");
  await expect(page.locator("#profile-name")).toHaveText("E2E Artist");
  await expect(page.locator("#profile-avatar img")).toHaveAttribute(
    "src",
    "https://res.cloudinary.com/example/image/upload/artfolio/avatars/e2e-artist.png"
  );
  await page.goto("/pages/portal.html?service=concept&tier=1&price=1");
  await expect(page.locator("[data-total]")).toHaveText("$240.00 USD");
  await expect(page.locator("#artist-name")).toHaveText("E2E Artist");
  await expect(page.locator("#artist-avatar img")).toHaveAttribute(
    "src",
    "https://res.cloudinary.com/example/image/upload/artfolio/avatars/e2e-artist.png"
  );
  await expect(page.locator("#request-message-label")).toHaveText("Mensaje para E2E Artist");

  await page.goto("/index.html");
  await expect(page.locator("#edit-profile-button")).toBeHidden();
  await expect(page.locator("#manage-services-button")).toBeHidden();

  await page.goto("/pages/portal.html?service=concept&tier=1");
  await page.locator("#request-message").fill("Prueba E2E del brief de la comisión.");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: /Aceptar términos e iniciar solicitud/ }).click();
  await expect(page.locator("#request-status"))
    .toContainText("Solicitud enviada correctamente");

  await page.goto("/pages/client-dashboard.html");
  await expect(page.locator(".order-card")).toHaveCount(1);
  await expect(page.locator(".order-card")).toContainText("Concept art cinematográfico");
  await expect(page.locator(".order-card")).toContainText("Pendiente");

  await page.goto("/pages/service.html?slug=e2e-starter-service");
  await page.locator("#commission-message").fill("Solicito este paquete de prueba.");
  await page.getByRole("button", { name: /Solicitar comisión/ }).click();
  await expect(page.locator("#request-status")).toContainText("$40.00 USD");

  await page.goto("/pages/client-dashboard.html");
  await expect(page.locator(".order-card")).toHaveCount(2);
  await expect(page.locator(".order-card")).toContainText("E2E Starter Service");
});
