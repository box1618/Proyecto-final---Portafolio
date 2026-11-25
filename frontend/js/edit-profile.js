const apiBaseUrl = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const token = sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
const form = document.getElementById("edit-profile-form");
const status = document.getElementById("edit-profile-status");
const avatarFileInput = document.getElementById("edit-avatar-file");

function showStatus(message, isError = false) {
  status.hidden = false;
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function readApiResponse(response, fallbackMessage) {
  const body = await response.text();
  let result;
  try {
    result = body ? JSON.parse(body) : {};
  } catch {
    const message = body.trim();
    throw new Error(message
      ? `El servidor respondió (${response.status}): ${message.slice(0, 180)}`
      : fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(result.error || result.message || fallbackMessage);
  }
  return result;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function updateAvatar(name, avatarUrl) {
  const avatar = document.getElementById("edit-avatar");
  if (!avatarUrl) {
    avatar.textContent = initials(name);
    return;
  }

  const image = document.createElement("img");
  image.src = avatarUrl;
  image.alt = "";
  avatar.replaceChildren(image);
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
    const result = await readApiResponse(response, "No se pudo cargar el perfil.");

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
    updateAvatar(profile.name, profile.avatarUrl);
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
    const result = await readApiResponse(response, "No se pudo guardar el perfil.");
    showStatus("Perfil actualizado.");
    updateAvatar(result.user.name, result.user.avatarUrl);
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "No se pudo guardar el perfil.", true);
  } finally {
    submitButton.disabled = false;
  }
});

avatarFileInput.addEventListener("change", async () => {
  const file = avatarFileInput.files && avatarFileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);
  avatarFileInput.disabled = true;
  showStatus("Subiendo foto de perfil…");

  try {
    const response = await fetch(`${apiBaseUrl}/users/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const result = await readApiResponse(response, "No se pudo subir la foto.");
    updateAvatar(document.getElementById("edit-name").value.trim(), result.avatarUrl);
    showStatus("Foto de perfil actualizada.");
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "No se pudo subir la foto.", true);
  } finally {
    avatarFileInput.value = "";
    avatarFileInput.disabled = false;
  }
});

loadEditableProfile();
