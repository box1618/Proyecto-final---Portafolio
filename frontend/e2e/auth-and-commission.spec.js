const { expect, test } = require("@playwright/test");

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
  await expect(page).toHaveURL(/index\.html$/);

  await page.goto("/pages/portal.html?service=concept&tier=1&price=240");
  await page.locator("#request-message").fill("Prueba E2E del brief de la comisión.");
  await page.locator('input[name="terms"]').check();
  await page.getByRole("button", { name: /Aceptar términos e iniciar solicitud/ }).click();
  await expect(page.locator("#request-status"))
    .toContainText("Solicitud enviada correctamente");
});
