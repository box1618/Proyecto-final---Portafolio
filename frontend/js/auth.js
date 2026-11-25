const authForm = document.querySelector("[data-auth-form]");
const authStatus = document.querySelector("#auth-status");
const authApiBase = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const authParams = new URLSearchParams(window.location.search);

function showAuthStatus(message, isError) {
  authStatus.hidden = false;
  authStatus.textContent = message;
  authStatus.classList.toggle("error", isError);
}

function validReturnPath() {
  const returnTo = authParams.get("returnTo");
  return returnTo && /^(?:portal\.html|client-dashboard\.html|edit-profile\.html|service\.html)(?:\?.*)?$/.test(returnTo)
    ? returnTo
    : "../index.html";
}

if (authForm.dataset.authForm === "login" && authParams.get("registered") === "1") {
  showAuthStatus("Tu cuenta quedó registrada. Ahora inicia sesión.", false);
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!authForm.reportValidity()) return;

  const mode = authForm.dataset.authForm;
  const email = authForm.querySelector("#email").value.trim();
  const password = authForm.querySelector("#password").value;
  const payload = { email, password };

  if (mode === "register") {
    const confirmation = authForm.querySelector("#confirm-password").value;
    if (password !== confirmation) {
      showAuthStatus("Las contraseñas no coinciden.", true);
      return;
    }

    const day = authForm.querySelector("#birth-day").value.padStart(2, "0");
    const month = authForm.querySelector("#birth-month").value;
    const year = authForm.querySelector("#birth-year").value;
    payload.name = authForm.querySelector("#username").value.trim();
    payload.birthDate = `${year}-${month}-${day}`;
  }

  const submitButton = authForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showAuthStatus("Procesando…", false);

  try {
    const response = await fetch(`${authApiBase}/users/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || result.mensaje || "No se pudo completar la solicitud.");
    }

    if (mode === "register") {
      window.location.assign("login.html?registered=1");
      return;
    }

    localStorage.removeItem("artfolioToken");
    sessionStorage.removeItem("artfolioToken");
    const remember = authForm.querySelector("#remember").checked;
    (remember ? localStorage : sessionStorage).setItem("artfolioToken", result.token);
    const destination = result.user?.role === "client"
      ? authParams.has("returnTo")
        ? validReturnPath()
        : "client-dashboard.html"
      : "../index.html";
    window.location.assign(destination);
  } catch (error) {
    showAuthStatus(error instanceof Error ? error.message : "No se pudo conectar con el servidor.", true);
  } finally {
    submitButton.disabled = false;
  }
});
