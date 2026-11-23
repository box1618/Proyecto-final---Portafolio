const apiBaseUrl = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const token = sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
const form = document.getElementById("edit-profile-form");
const status = document.getElementById("edit-profile-status");

function showStatus(message, isError = false) {
  status.hidden = false;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function loadEditableProfile() {
  if (!token) {
    window.location.assign("login.html?returnTo=edit-profile.html");
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo cargar el perfil.");

    const profile = result.user;
    if (profile.role !== "admin" && profile.role !== "artist") {
      showStatus("Solo el administrador o un artista pueden editar este perfil.", true);
      form.querySelectorAll("input, textarea, button").forEach((field) => { field.disabled = true; });
      return;
    }

    document.getElementById("edit-name").value = profile.name;
    document.getElementById("edit-handle").value = profile.handle;
    document.getElementById("edit-title").value = profile.artistTitle;
    document.getElementById("edit-bio").value = profile.bio;
    document.getElementById("edit-response").value = profile.responseTime;
    document.getElementById("edit-avatar").textContent = initials(profile.name);
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "No se pudo cargar el perfil.", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  showStatus("Guardando cambios…");

  const payload = {
    name: document.getElementById("edit-name").value.trim(),
    handle: document.getElementById("edit-handle").value.trim(),
    artistTitle: document.getElementById("edit-title").value.trim(),
    bio: document.getElementById("edit-bio").value.trim(),
    responseTime: document.getElementById("edit-response").value.trim()
  };

  try {
    const response = await fetch(`${apiBaseUrl}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo guardar el perfil.");
    showStatus("Perfil actualizado.");
    document.getElementById("edit-avatar").textContent = initials(result.user.name);
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "No se pudo guardar el perfil.", true);
  } finally {
    submitButton.disabled = false;
  }
});

loadEditableProfile();
