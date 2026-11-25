const dashboardApiBase = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const dashboardStatus = document.querySelector("#dashboard-status");
const ordersList = document.querySelector("#orders-list");
const filterButtons = document.querySelectorAll("[data-filter]");
const clientProfileForm = document.querySelector("#client-profile-form");
const clientProfileStatus = document.querySelector("#client-profile-status");
const clientProfileSection = document.querySelector("#client-profile");
const editClientProfileButton = document.querySelector("#edit-client-profile-button");
const avatarFileInput = document.querySelector("#profile-avatar-file");
let commissions = [];
let currentFilter = "all";
let clientProfile = null;

function getDashboardToken() {
  return sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
}

function showDashboardStatus(message, isError) {
  dashboardStatus.hidden = false;
  dashboardStatus.textContent = message;
  dashboardStatus.classList.toggle("error", isError);
}

function showProfileStatus(message, tone) {
  clientProfileStatus.hidden = false;
  clientProfileStatus.textContent = message;
  clientProfileStatus.classList.toggle("error", tone === "error");
  clientProfileStatus.classList.toggle("success", tone === "success");
}

function getClientInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function updateClientAvatar(name, avatarUrl) {
  const image = document.querySelector("#client-avatar-image");
  document.querySelector("#client-avatar-initials").textContent = getClientInitials(name) || "C";
  if (avatarUrl) {
    image.src = avatarUrl;
    image.hidden = false;
  } else {
    image.removeAttribute("src");
    image.hidden = true;
  }
}

async function readDashboardResponse(response, fallbackMessage) {
  const body = await response.text();
  let result;
  try {
    result = body ? JSON.parse(body) : {};
  } catch {
    throw new Error(body.trim()
      ? `El servidor respondió (${response.status}): ${body.trim().slice(0, 180)}`
      : fallbackMessage);
  }
  if (!response.ok) throw new Error(result.error || result.message || fallbackMessage);
  return result;
}

function toggleClientProfile(forceOpen) {
  const shouldOpen = forceOpen === undefined ? clientProfileSection.hidden : forceOpen;
  clientProfileSection.hidden = !shouldOpen;
  editClientProfileButton.textContent = shouldOpen ? "Cerrar edición" : "Editar perfil";
  editClientProfileButton.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen) {
    clientProfileSection.scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector("#profile-name").focus({ preventScroll: true });
    return;
  }

  if (clientProfile) {
    document.querySelector("#profile-name").value = clientProfile.name || "";
    document.querySelector("#profile-handle").value = clientProfile.handle || "";
    document.querySelector("#profile-bio").value = clientProfile.bio || "";
  }
  avatarFileInput.value = "";
  clientProfileStatus.hidden = true;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function statusLabel(status) {
  const labels = {
    pending: "Pendiente",
    accepted: "Aceptada",
    in_progress: "En progreso",
    completed: "Completada",
    rejected: "Rechazada"
  };
  return labels[status] || "Estado no disponible";
}

function serviceLabel(service) {
  const labels = { concept: "Concept Art", "3d": "Dibujo renderizado", animation: "Animación 2D" };
  return labels[service] || "Comisión";
}

function renderOrders() {
  ordersList.replaceChildren();
  const visibleOrders = commissions.filter((commission) => {
    if (currentFilter === "completed") return commission.status === "completed";
    if (currentFilter === "active") return !["completed", "rejected"].includes(commission.status);
    return true;
  });

  if (!visibleOrders.length) {
    showDashboardStatus(currentFilter === "completed"
      ? "Aún no tienes comisiones completadas."
      : currentFilter === "active"
        ? "No tienes solicitudes en progreso."
        : "Todavía no tienes solicitudes. Explora las comisiones para empezar.");
    return;
  }

  dashboardStatus.hidden = true;
  visibleOrders.forEach((commission) => {
    const card = document.createElement("article");
    card.className = "order-card";

    const main = document.createElement("div");
    main.className = "order-main";
    const topline = document.createElement("div");
    topline.className = "order-topline";
    const title = document.createElement("h3");
    title.textContent = commission.title || "Comisión sin título";
    const badge = document.createElement("span");
    badge.className = `status-badge${commission.status === "completed" ? " completed" : ""}${commission.status === "rejected" ? " rejected" : ""}`;
    badge.textContent = statusLabel(commission.status);
    topline.append(title, badge);

    const meta = document.createElement("div");
    meta.className = "order-meta";
    const service = document.createElement("span");
    service.textContent = commission.serviceName || serviceLabel(commission.service);
    if (commission.packageName) {
      const packageName = document.createElement("span");
      packageName.textContent = `Paquete: ${commission.packageName}`;
      meta.append(service, packageName);
    } else {
      meta.append(service);
    }
    const date = document.createElement("span");
    date.className = "order-date";
    date.textContent = commission.status === "completed" && commission.completedAt
      ? `Completada el ${formatDate(commission.completedAt)}`
      : `Solicitada el ${formatDate(commission.requestedAt)}`;
    meta.append(date);

    const price = document.createElement("p");
    price.className = "order-price";
    price.textContent = `$${Number(commission.budget || 0).toFixed(2)} USD`;
    main.append(topline, meta, price);
    card.append(main);
    ordersList.append(card);
  });
}

function updateFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderOrders();
}

async function loadClientDashboard() {
  const token = getDashboardToken();
  if (!token) {
    window.location.replace(`login.html?returnTo=${encodeURIComponent("client-dashboard.html")}`);
    return;
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [profileResponse, commissionsResponse] = await Promise.all([
      fetch(`${dashboardApiBase}/users/me`, { headers }),
      fetch(`${dashboardApiBase}/commissions`, { headers })
    ]);

    if (profileResponse.status === 401 || commissionsResponse.status === 401) {
      localStorage.removeItem("artfolioToken");
      sessionStorage.removeItem("artfolioToken");
      window.location.replace(`login.html?returnTo=${encodeURIComponent("client-dashboard.html")}`);
      return;
    }

    if (profileResponse.status === 403 || commissionsResponse.status === 403) {
      window.location.replace("../index.html");
      return;
    }

    const profileResult = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new Error(profileResult.error || "No se pudo validar tu cuenta.");
    }
    if (profileResult.user?.role !== "client") {
      window.location.replace("../index.html");
      return;
    }

    const commissionsResult = await commissionsResponse.json();
    if (!commissionsResponse.ok) {
      throw new Error(commissionsResult.error || "No se pudieron cargar tus solicitudes.");
    }
    if (!Array.isArray(commissionsResult.commissions)) {
      throw new Error("La respuesta de solicitudes no tiene un formato válido.");
    }

    document.querySelector("#client-name").textContent = profileResult.user.name;
    document.querySelector("#client-email").textContent = profileResult.user.email;
    clientProfile = {
      name: profileResult.user.name || "",
      handle: profileResult.user.handle || "",
      bio: profileResult.user.bio || "",
      avatarUrl: profileResult.user.avatarUrl || ""
    };
    document.querySelector("#profile-name").value = clientProfile.name;
    document.querySelector("#profile-handle").value = clientProfile.handle;
    document.querySelector("#profile-bio").value = clientProfile.bio;
    updateClientAvatar(profileResult.user.name || "", profileResult.user.avatarUrl);
    commissions = commissionsResult.commissions;
    document.querySelector("#total-count").textContent = String(commissions.length);
    document.querySelector("#active-count").textContent = String(
      commissions.filter((commission) => !["completed", "rejected"].includes(commission.status)).length
    );
    document.querySelector("#completed-count").textContent = String(
      commissions.filter((commission) => commission.status === "completed").length
    );
    renderOrders();
  } catch (error) {
    showDashboardStatus(error instanceof Error ? error.message : "No se pudieron cargar tus solicitudes.", true);
  }
}

clientProfileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!clientProfileForm.reportValidity()) return;

  const saveButton = document.querySelector("#save-profile-button");
  saveButton.disabled = true;
  showProfileStatus("Guardando tu perfil...", "");
  try {
    const response = await fetch(`${dashboardApiBase}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getDashboardToken()}`
      },
      body: JSON.stringify({
        name: document.querySelector("#profile-name").value.trim(),
        handle: document.querySelector("#profile-handle").value.trim(),
        bio: document.querySelector("#profile-bio").value.trim()
      })
    });
    const result = await readDashboardResponse(response, "No se pudo guardar tu perfil.");
    clientProfile = {
      ...clientProfile,
      name: result.user.name,
      handle: result.user.handle || "",
      bio: result.user.bio || ""
    };
    document.querySelector("#client-name").textContent = result.user.name;
    updateClientAvatar(result.user.name, result.user.avatarUrl);
    showProfileStatus("Perfil actualizado.", "success");
  } catch (error) {
    showProfileStatus(error instanceof Error ? error.message : "No se pudo guardar tu perfil.", "error");
  } finally {
    saveButton.disabled = false;
  }
});

avatarFileInput.addEventListener("change", async () => {
  const file = avatarFileInput.files && avatarFileInput.files[0];
  if (!file) return;
  avatarFileInput.value = "";

  if (file.size > 5 * 1024 * 1024) {
    showProfileStatus("La foto debe pesar 5 MB o menos.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("avatar", file);
  avatarFileInput.disabled = true;
  showProfileStatus("Subiendo foto de perfil...", "");
  try {
    const response = await fetch(`${dashboardApiBase}/users/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getDashboardToken()}` },
      body: formData
    });
    const result = await readDashboardResponse(response, "No se pudo actualizar la foto.");
    clientProfile.avatarUrl = result.avatarUrl;
    updateClientAvatar(document.querySelector("#profile-name").value.trim(), result.avatarUrl);
    showProfileStatus("Foto de perfil actualizada.", "success");
  } catch (error) {
    showProfileStatus(error instanceof Error ? error.message : "No se pudo actualizar la foto.", "error");
  } finally {
    avatarFileInput.disabled = false;
  }
});

editClientProfileButton.addEventListener("click", () => toggleClientProfile());

filterButtons.forEach((button) => {
  button.addEventListener("click", () => updateFilter(button.dataset.filter));
});

document.querySelector("#logout-button").addEventListener("click", () => {
  localStorage.removeItem("artfolioToken");
  sessionStorage.removeItem("artfolioToken");
  window.location.assign("login.html");
});

loadClientDashboard();
