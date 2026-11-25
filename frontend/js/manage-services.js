const managerApiBase = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const serviceForm = document.querySelector("#service-form");
const editorStatus = document.querySelector("#editor-status");
const listStatus = document.querySelector("#list-status");
const serviceList = document.querySelector("#service-list");
const packageList = document.querySelector("#package-list");
const imageList = document.querySelector("#image-list");
const imageFiles = document.querySelector("#service-images");
let serviceImages = [];
let services = [];
let uploadingImages = false;

function getManagerToken() {
  return sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
}

function setStatus(element, message, tone) {
  element.hidden = false;
  element.textContent = message;
  element.classList.toggle("error", tone === "error");
  element.classList.toggle("success", tone === "success");
}

async function parseResponse(response, fallback) {
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || fallback);
  return result;
}

function buildPackageField(labelText, name, value, type, attributes = {}) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  input.dataset.packageField = name;
  input.value = value || "";
  if (type === "number") {
    input.min = attributes.min || "1";
    input.max = attributes.max || "365";
    input.step = attributes.step || "1";
  }
  input.required = true;
  label.append(input);
  return label;
}

function addPackageEditor(packageData = {}) {
  if (packageList.children.length >= 5) {
    setStatus(editorStatus, "Un servicio puede tener hasta 5 paquetes.", "error");
    return;
  }

  const card = document.createElement("div");
  card.className = "package-card";
  card.append(
    buildPackageField("Nombre", "name", packageData.name, "text"),
    buildPackageField("Precio USD", "price", packageData.price, "number", { min: "0.01", max: "1000000", step: "0.01" }),
    buildPackageField("Descripción", "description", packageData.description, "textarea"),
    buildPackageField("Entrega (días)", "deliveryDays", packageData.deliveryDays, "number"),
    buildPackageField("Incluye", "included", packageData.included, "textarea")
  );
  card.querySelectorAll("textarea").forEach((textarea) => textarea.closest("label").classList.add("wide"));

  const removeButton = document.createElement("button");
  removeButton.className = "secondary-button";
  removeButton.type = "button";
  removeButton.textContent = "Quitar paquete";
  removeButton.addEventListener("click", () => {
    if (packageList.children.length === 1) {
      setStatus(editorStatus, "Cada servicio necesita al menos un paquete.", "error");
      return;
    }
    card.remove();
  });
  card.append(removeButton);
  packageList.append(card);
}

function renderImages() {
  imageList.replaceChildren();
  serviceImages.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = "image-item";
    const image = document.createElement("img");
    image.src = url;
    image.alt = `Imagen ${index + 1} del servicio`;
    const removeButton = document.createElement("button");
    removeButton.className = "image-remove";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Quitar imagen ${index + 1}`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      serviceImages.splice(index, 1);
      renderImages();
    });
    item.append(image, removeButton);
    imageList.append(item);
  });
}

function resetEditor() {
  serviceForm.reset();
  document.querySelector("#service-id").value = "";
  document.querySelector("#service-slug").disabled = false;
  document.querySelector("#service-active").checked = true;
  document.querySelector("#service-order").value = "0";
  document.querySelector("#editor-title").textContent = "Agregar un servicio";
  serviceForm.querySelector(".save-button").textContent = "Guardar servicio";
  serviceImages = [];
  packageList.replaceChildren();
  addPackageEditor();
  renderImages();
  editorStatus.hidden = true;
}

function editService(service) {
  document.querySelector("#service-id").value = service._id;
  document.querySelector("#service-slug").value = service.slug;
  document.querySelector("#service-slug").disabled = true;
  document.querySelector("#service-category").value = service.category;
  document.querySelector("#service-title").value = service.title;
  document.querySelector("#service-description").value = service.description;
  document.querySelector("#service-rules").value = service.rules.join("\n");
  document.querySelector("#service-order").value = String(service.displayOrder);
  document.querySelector("#service-active").checked = service.active;
  document.querySelector("#editor-title").textContent = "Editar servicio";
  serviceForm.querySelector(".save-button").textContent = "Guardar cambios";
  serviceImages = [...service.images];
  renderImages();
  packageList.replaceChildren();
  service.packages.forEach((packageData) => addPackageEditor(packageData));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderServiceList() {
  serviceList.replaceChildren();
  if (!services.length) {
    setStatus(listStatus, "Todavía no hay servicios. Puedes crear el primero desde el formulario.", "");
    return;
  }

  listStatus.hidden = true;
  services.forEach((service) => {
    const item = document.createElement("article");
    item.className = "service-item";
    const summary = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = service.title;
    const state = document.createElement("span");
    state.textContent = service.active ? service.category : `${service.category} · Oculto`;
    if (!service.active) state.classList.add("inactive-label");
    summary.append(title, state);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => editService(service));
    item.append(summary, editButton);
    serviceList.append(item);
  });
}

async function loadServices() {
  const response = await fetch(`${managerApiBase}/services/manage`, {
    headers: { Authorization: `Bearer ${getManagerToken()}` }
  });
  const result = await parseResponse(response, "No se pudieron cargar los servicios.");
  services = result.services;
  renderServiceList();
}

async function authorizeArtist() {
  const token = getManagerToken();
  if (!token) {
    window.location.replace(`login.html?returnTo=${encodeURIComponent("manage-services.html")}`);
    return false;
  }

  const response = await fetch(`${managerApiBase}/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 401) {
    localStorage.removeItem("artfolioToken");
    sessionStorage.removeItem("artfolioToken");
    window.location.replace(`login.html?returnTo=${encodeURIComponent("manage-services.html")}`);
    return false;
  }
  const result = await parseResponse(response, "No se pudo validar la sesión.");
  if (!["admin", "artist"].includes(result.user?.role)) {
    window.location.replace("../index.html");
    return false;
  }
  return true;
}

imageFiles.addEventListener("change", async () => {
  const files = Array.from(imageFiles.files || []);
  imageFiles.value = "";
  if (!files.length) return;
  if (uploadingImages) {
    setStatus(editorStatus, "Espera a que termine la subida actual.", "error");
    return;
  }
  if (serviceImages.length + files.length > 6) {
    setStatus(editorStatus, "Puedes guardar hasta 6 imágenes por servicio.", "error");
    return;
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const uploadButton = imageFiles.closest(".upload-control");
  uploadingImages = true;
  imageFiles.disabled = true;
  uploadButton.classList.add("uploading");
  setStatus(editorStatus, "Subiendo imágenes a Cloudinary...", "");
  try {
    const response = await fetch(`${managerApiBase}/services/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getManagerToken()}` },
      body: formData
    });
    const result = await parseResponse(response, "No se pudieron subir las imágenes.");
    serviceImages.push(...result.images);
    renderImages();
    setStatus(editorStatus, "Imágenes subidas. Guarda el servicio para publicar los cambios.", "success");
  } catch (error) {
    setStatus(editorStatus, error instanceof Error ? error.message : "No se pudieron subir las imágenes.", "error");
  } finally {
    uploadingImages = false;
    imageFiles.disabled = false;
    uploadButton.classList.remove("uploading");
  }
});

serviceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (uploadingImages) {
    setStatus(editorStatus, "Espera a que termine la subida de imágenes antes de guardar.", "error");
    return;
  }
  if (!serviceForm.reportValidity()) return;

  const packages = Array.from(packageList.children).map((card) => {
    const value = (name) => card.querySelector(`[data-package-field="${name}"]`).value.trim();
    return {
      name: value("name"),
      price: Number(value("price")),
      description: value("description"),
      deliveryDays: Number(value("deliveryDays")),
      included: value("included")
    };
  });
  const serviceData = {
    slug: document.querySelector("#service-slug").value.trim().toLowerCase(),
    category: document.querySelector("#service-category").value.trim(),
    title: document.querySelector("#service-title").value.trim(),
    description: document.querySelector("#service-description").value.trim(),
    rules: document.querySelector("#service-rules").value.split("\n").map((rule) => rule.trim()).filter(Boolean),
    images: serviceImages,
    packages,
    active: document.querySelector("#service-active").checked,
    displayOrder: Number(document.querySelector("#service-order").value)
  };
  const serviceId = document.querySelector("#service-id").value;
  const saveButton = serviceForm.querySelector(".save-button");
  saveButton.disabled = true;
  setStatus(editorStatus, "Guardando servicio...", "");

  try {
    const response = await fetch(`${managerApiBase}/services${serviceId ? `/${encodeURIComponent(serviceId)}` : ""}`, {
      method: serviceId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getManagerToken()}`
      },
      body: JSON.stringify(serviceData)
    });
    const result = await parseResponse(response, "No se pudo guardar el servicio.");
    setStatus(editorStatus, result.mensaje || "Servicio guardado.", "success");
    await loadServices();
    resetEditor();
    setStatus(editorStatus, "Servicio guardado y catálogo actualizado.", "success");
  } catch (error) {
    setStatus(editorStatus, error instanceof Error ? error.message : "No se pudo guardar el servicio.", "error");
  } finally {
    saveButton.disabled = false;
  }
});

document.querySelector("#add-package-button").addEventListener("click", () => addPackageEditor());
document.querySelector("#new-service-button").addEventListener("click", resetEditor);
document.querySelector("#cancel-edit-button").addEventListener("click", resetEditor);

async function initializeManager() {
  try {
    if (!(await authorizeArtist())) return;
    resetEditor();
    await loadServices();
  } catch (error) {
    setStatus(listStatus, error instanceof Error ? error.message : "No se pudo cargar el panel.", "error");
  }
}

void initializeManager();
