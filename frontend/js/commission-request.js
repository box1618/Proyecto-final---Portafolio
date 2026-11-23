const services = {
  concept: {
    category: "Concept Art · Entornos",
    title: "Concept art cinematográfico",
    package: "Estándar",
    price: 240,
    description: "Entorno completo con color y luz.",
    delivery: "7 días",
    included: "Escena completa, 2 revisiones y PSD",
    page: "concept-art.html",
    visual: "concept"
  },
  "3d": {
    category: "Ilustración digital · Personajes y escenas",
    title: "Dibujo renderizado",
    package: "Ilustración",
    price: 450,
    description: "Una ilustración a color con acabado renderizado.",
    delivery: "12 días",
    included: "Personaje a color y 2 revisiones",
    page: "art.html",
    visual: "3d"
  },
  animation: {
    category: "Animación 2D · Motion",
    title: "Animación 2D y motion",
    package: "Secuencia",
    price: 380,
    description: "Combate, personaje o escena corta.",
    delivery: "10 días",
    included: "Hasta 8 s, 2 revisiones, MP4 HD",
    page: "animation-art.html",
    visual: "animation"
  }
};

const params = new URLSearchParams(window.location.search);
const requestedService = params.get("service");
const validService = requestedService === null || Object.prototype.hasOwnProperty.call(services, requestedService);
const serviceKey = validService ? requestedService || "concept" : "concept";
const service = services[serviceKey];
const requestForm = document.querySelector("#request-form");
const requestStatus = document.querySelector("#request-status");
const submitButton = requestForm.querySelector('button[type="submit"]');
const priceParam = params.get("price");
const parsedPrice = priceParam === null ? service.price : Number(priceParam);
const validPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
const basePrice = validPrice ? parsedPrice : service.price;
const apiBaseUrl = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
let totalBudget = basePrice;

function getAccessToken() {
  return sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
}

function showRequestStatus(message, isError) {
  requestStatus.hidden = false;
  requestStatus.textContent = message;
  requestStatus.classList.toggle("error", isError);
}

document.body.dataset.service = serviceKey;
document.querySelector("[data-category]").textContent = params.get("category") || service.category;
document.querySelector("[data-title]").textContent = params.get("title") || service.title;
document.querySelector("[data-package]").textContent = params.get("package") || service.package;
document.querySelector("[data-description]").textContent = params.get("description") || service.description;
document.querySelector("[data-delivery]").textContent = params.get("delivery") || service.delivery;
document.querySelector("[data-included]").textContent = params.get("included") || service.included;
document.querySelector("[data-back-link]").href = service.page;

const artwork = document.querySelector("[data-artwork]");
artwork.classList.remove("visual-concept", "visual-3d", "visual-animation");
artwork.classList.add(`visual-${service.visual}`);

if (params.has("commercial")) {
  requestForm.querySelector('[data-license="commercial"]').checked = params.get("commercial") === "true";
}
if (params.has("merchandising")) {
  requestForm.querySelector('[data-license="merchandising"]').checked = params.get("merchandising") === "true";
}

const updateTotal = () => {
  const rate = Array.from(requestForm.querySelectorAll("input[data-rate]")).reduce((total, input) => (
    input.checked ? total + Number(input.dataset.rate) : total
  ), 0);
  totalBudget = basePrice * (1 + rate);
  document.querySelector("[data-total]").textContent = `$${totalBudget.toFixed(2)} USD`;
};

requestForm.querySelectorAll("input[data-rate]").forEach((input) => {
  input.addEventListener("change", updateTotal);
});
updateTotal();

if (!validService || !validPrice) {
  showRequestStatus("No se pudo validar el servicio o el precio. Vuelve a la ficha y selecciona la comisión de nuevo.", true);
  submitButton.disabled = true;
}

if (!getAccessToken()) {
  const returnTo = `portal.html${window.location.search}`;
  window.location.replace(`login.html?returnTo=${encodeURIComponent(returnTo)}`);
}

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!requestForm.reportValidity() || !validService || !validPrice) return;

  const token = getAccessToken();
  if (!token) {
    const returnTo = `portal.html${window.location.search}`;
    window.location.replace(`login.html?returnTo=${encodeURIComponent(returnTo)}`);
    return;
  }

  const selectedLicenses = Array.from(requestForm.querySelectorAll("input[data-license]:checked"))
    .map((input) => input.dataset.license);
  const description = [
    `Categoría: ${document.querySelector("[data-category]").textContent}`,
    `Paquete: ${document.querySelector("[data-package]").textContent}`,
    `Licencias: ${selectedLicenses.length ? selectedLicenses.join(", ") : "uso personal"}`,
    `Mensaje: ${requestForm.querySelector("#request-message").value.trim() || "Sin mensaje adicional."}`
  ].join("\n");

  submitButton.disabled = true;
  showRequestStatus("Enviando solicitud…", false);
  try {
    const response = await fetch(`${apiBaseUrl}/commissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: document.querySelector("[data-title]").textContent,
        description,
        service: serviceKey,
        tier: params.get("tier") || "1",
        licenses: selectedLicenses
      })
    });
    const result = await response.json();
    if (response.status === 401) {
      localStorage.removeItem("artfolioToken");
      sessionStorage.removeItem("artfolioToken");
      window.location.replace(`login.html?returnTo=${encodeURIComponent(`portal.html${window.location.search}`)}`);
      return;
    }
    if (!response.ok) {
      throw new Error(result.error || "No se pudo enviar la solicitud.");
    }

    showRequestStatus(
      `Solicitud enviada correctamente. Folio: ${result.commission.id}. Presupuesto estimado: $${result.commission.budget.toFixed(2)} USD.`,
      false
    );
    requestForm.querySelector('button[type="submit"]').disabled = true;
  } catch (error) {
    showRequestStatus(error instanceof Error ? error.message : "No se pudo conectar con el servidor.", true);
    submitButton.disabled = false;
  }
});
