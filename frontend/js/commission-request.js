const services = {
  concept: {
    category: "Concept Art · Entornos",
    title: "Concept art cinematográfico",
    package: "Estándar",
    price: 240,
    description: "Entorno completo con color y luz.",
    delivery: "7 días",
    included: "Escena completa, 2 revisiones y PSD",
    artwork: "Solaris",
    page: "concept-art.html",
    visual: "concept"
  },
  "3d": {
    category: "3D · Personajes y escultura",
    title: "Personajes y escultura digital 3D",
    package: "Personaje",
    price: 450,
    description: "Personaje o criatura completa.",
    delivery: "12 días",
    included: "Modelo, texturas PBR y 2 revisiones",
    artwork: "Aura",
    page: "3d-art.html",
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
    artwork: "Motion",
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

document.body.dataset.service = serviceKey;
document.querySelector("[data-category]").textContent = params.get("category") || service.category;
document.querySelector("[data-title]").textContent = params.get("title") || service.title;
document.querySelector("[data-package]").textContent = params.get("package") || service.package;
document.querySelector("[data-description]").textContent = params.get("description") || service.description;
document.querySelector("[data-delivery]").textContent = params.get("delivery") || service.delivery;
document.querySelector("[data-included]").textContent = params.get("included") || service.included;
document.querySelector("[data-artwork-title]").textContent = service.artwork;
document.querySelector("[data-artwork]").setAttribute("aria-label", `Previsualización de ${service.artwork}`);
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
  const total = basePrice * (1 + rate);
  document.querySelector("[data-total]").textContent = `$${total.toFixed(2)} USD`;
};

requestForm.querySelectorAll("input[data-rate]").forEach((input) => {
  input.addEventListener("change", updateTotal);
});
updateTotal();

if (!validService || !validPrice) {
  requestStatus.hidden = false;
  requestStatus.textContent = "No se pudo validar el servicio o el precio. Vuelve a la ficha y selecciona la comisión de nuevo.";
  submitButton.disabled = true;
}

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!requestForm.reportValidity() || !validService || !validPrice) return;

  requestStatus.hidden = false;
  requestStatus.textContent = "La solicitud está lista, pero todavía no se envía: falta conectar este formulario al servidor.";
});
