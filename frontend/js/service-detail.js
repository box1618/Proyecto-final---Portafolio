const detailApiBase = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const detailSlug = new URLSearchParams(window.location.search).get("slug");
const detailStatus = document.querySelector("#service-status");
const detailContent = document.querySelector("#service-content");
const packageOptions = document.querySelector("#package-options");
const requestStatus = document.querySelector("#request-status");
const requestButton = document.querySelector("#submit-commission");
let currentService = null;
let selectedPackage = null;

function showServiceStatus(message, isError) {
  detailStatus.hidden = false;
  detailStatus.textContent = message;
  detailStatus.classList.toggle("error", isError);
}

function showRequestStatus(message, isError) {
  requestStatus.hidden = false;
  requestStatus.textContent = message;
  requestStatus.classList.toggle("error", isError);
}

function getServiceToken() {
  return sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
}

function formatPrice(price) {
  return `$${Number(price).toFixed(2)} USD`;
}

function selectPackage(packageData) {
  selectedPackage = packageData;
  packageOptions.querySelectorAll(".package-choice").forEach((button) => {
    const active = button.dataset.packageId === packageData._id;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const summary = document.querySelector("#selected-package");
  summary.replaceChildren();
  const priceRow = document.createElement("div");
  priceRow.className = "selected-price";
  const label = document.createElement("span");
  label.textContent = packageData.name;
  const price = document.createElement("strong");
  price.textContent = formatPrice(packageData.price);
  priceRow.append(label, price);
  const details = document.createElement("div");
  details.className = "package-details";
  const description = document.createElement("span");
  description.textContent = packageData.description;
  const included = document.createElement("span");
  included.textContent = `Incluye: ${packageData.included}`;
  const delivery = document.createElement("span");
  delivery.textContent = `Entrega estimada: ${packageData.deliveryDays} días`;
  details.append(description, included, delivery);
  summary.append(priceRow, details);
}

function renderService(service) {
  currentService = service;
  document.title = `${service.title} - Artfolio Studio`;
  document.querySelector("#breadcrumb-title").textContent = service.title;
  document.querySelector("#service-category").textContent = service.category;
  document.querySelector("#service-title").textContent = service.title;
  document.querySelector("#service-description").textContent = service.description;
  document.querySelector("#service-rules").replaceChildren();
  service.rules.forEach((rule) => {
    const item = document.createElement("li");
    item.textContent = rule;
    document.querySelector("#service-rules").append(item);
  });

  const mainImage = document.querySelector("#main-image");
  const thumbnails = document.querySelector("#image-thumbnails");
  thumbnails.replaceChildren();
  if (service.images.length) {
    mainImage.src = service.images[0];
    mainImage.alt = `${service.title} - imagen de muestra`;
    mainImage.hidden = false;
    service.images.forEach((url, index) => {
      const button = document.createElement("button");
      button.className = `thumbnail-button${index === 0 ? " selected" : ""}`;
      button.type = "button";
      button.setAttribute("aria-label", `Ver imagen ${index + 1}`);
      const image = document.createElement("img");
      image.src = url;
      image.alt = "";
      button.append(image);
      button.addEventListener("click", () => {
        mainImage.src = url;
        mainImage.alt = `${service.title} - imagen ${index + 1}`;
        thumbnails.querySelectorAll(".thumbnail-button").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
      thumbnails.append(button);
    });
  } else {
    mainImage.hidden = true;
    const placeholder = document.createElement("p");
    placeholder.className = "image-placeholder";
    placeholder.textContent = "El artista todavía no ha agregado imágenes.";
    thumbnails.append(placeholder);
  }

  packageOptions.replaceChildren();
  service.packages.forEach((packageData, index) => {
    const button = document.createElement("button");
    button.className = "package-choice";
    button.type = "button";
    button.dataset.packageId = packageData._id;
    button.setAttribute("aria-pressed", "false");
    const main = document.createElement("div");
    main.className = "package-choice-main";
    const name = document.createElement("span");
    name.textContent = packageData.name;
    const price = document.createElement("span");
    price.textContent = formatPrice(packageData.price);
    main.append(name, price);
    const description = document.createElement("p");
    description.textContent = packageData.description;
    button.append(main, description);
    button.addEventListener("click", () => selectPackage(packageData));
    packageOptions.append(button);
    if (index === 0) selectPackage(packageData);
  });

  detailStatus.hidden = true;
  detailContent.hidden = false;
}

async function loadService() {
  if (!detailSlug) {
    showServiceStatus("No se indicó qué servicio consultar.", true);
    return;
  }
  try {
    const response = await fetch(`${detailApiBase}/services/${encodeURIComponent(detailSlug)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo cargar el servicio.");
    if (!result.service || !Array.isArray(result.service.packages) || !result.service.packages.length) {
      throw new Error("Los datos del servicio están incompletos.");
    }
    renderService(result.service);
  } catch (error) {
    showServiceStatus(error instanceof Error ? error.message : "No se pudo cargar el servicio.", true);
  }
}

document.querySelector("#commission-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !currentService || !selectedPackage) return;

  const token = getServiceToken();
  if (!token) {
    const returnTo = `service.html?slug=${encodeURIComponent(currentService.slug)}`;
    window.location.assign(`login.html?returnTo=${encodeURIComponent(returnTo)}`);
    return;
  }

  requestButton.disabled = true;
  showRequestStatus("Enviando solicitud...", false);
  try {
    const response = await fetch(`${detailApiBase}/commissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        listingId: currentService._id,
        packageId: selectedPackage._id,
        description: document.querySelector("#commission-message").value.trim()
      })
    });
    const result = await response.json();
    if (response.status === 401) {
      localStorage.removeItem("artfolioToken");
      sessionStorage.removeItem("artfolioToken");
      const returnTo = `service.html?slug=${encodeURIComponent(currentService.slug)}`;
      window.location.replace(`login.html?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (!response.ok) throw new Error(result.error || "No se pudo crear la solicitud.");
    showRequestStatus(`Solicitud enviada. Presupuesto: ${formatPrice(result.commission.budget)}.`, false);
    form.reset();
    requestButton.disabled = true;
  } catch (error) {
    showRequestStatus(error instanceof Error ? error.message : "No se pudo enviar la solicitud.", true);
    requestButton.disabled = false;
  }
});

void loadService();
