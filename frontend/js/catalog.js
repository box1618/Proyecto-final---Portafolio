const catalogApiBase = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const catalogList = document.querySelector("#commission-list");
const catalogStatus = document.querySelector("#catalog-status");
const categoryNav = document.querySelector("#category-nav");

function categoryAnchorId(category) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createServiceCard(service) {
  const card = document.createElement("a");
  card.className = "commission-card";
  card.href = `pages/service.html?slug=${encodeURIComponent(service.slug)}`;

  const artwork = makeElement("div", "commission-art");
  artwork.setAttribute("aria-hidden", "true");
  if (service.images[0]) {
    const image = document.createElement("img");
    image.src = service.images[0];
    image.alt = "";
    image.loading = "lazy";
    artwork.append(image);
  }

  const info = makeElement("div", "commission-info");
  const titleRow = makeElement("div", "commission-title-row");
  titleRow.append(makeElement("h3", "", service.title));
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-arrow-up-right-from-square";
  icon.setAttribute("aria-hidden", "true");
  titleRow.append(icon);
  info.append(titleRow);
  info.append(makeElement("p", "", service.description));

  const lowestPrice = Math.min(...service.packages.map((item) => item.price));
  const shortestDelivery = Math.min(...service.packages.map((item) => item.deliveryDays));
  const meta = makeElement("div", "commission-meta");
  const priceText = makeElement("span");
  priceText.append(document.createTextNode("Desde "));
  priceText.append(makeElement("strong", "", `$${lowestPrice.toFixed(2)} USD`));
  meta.append(priceText, makeElement("span", "", `Entrega desde ${shortestDelivery} días`));
  info.append(meta);

  const linkLabel = makeElement("span", "commission-link", "Ver detalles y paquetes ");
  const arrow = document.createElement("i");
  arrow.className = "fa-solid fa-arrow-right";
  arrow.setAttribute("aria-hidden", "true");
  linkLabel.append(arrow);
  info.append(linkLabel);
  card.append(artwork, info);
  return card;
}

function renderCatalog(services) {
  catalogList.replaceChildren();
  categoryNav.replaceChildren();
  document.querySelector("#service-count").textContent = String(services.length);

  const groups = new Map();
  services.forEach((service) => {
    if (!groups.has(service.category)) groups.set(service.category, []);
    groups.get(service.category).push(service);
  });

  let groupIndex = 0;
  groups.forEach((items, category) => {
    const id = `${categoryAnchorId(category) || "categoria"}-${groupIndex}`;
    groupIndex += 1;
    const navLink = makeElement("a", "", category);
    navLink.href = `#${id}`;
    categoryNav.append(navLink);

    const group = makeElement("section", "commission-group");
    group.id = id;
    const heading = makeElement("div", "group-heading");
    heading.append(makeElement("h2", "", category), makeElement("span", "open-label", "ABIERTO"));
    group.append(heading);
    items.forEach((service) => group.append(createServiceCard(service)));
    catalogList.append(group);
  });

  catalogStatus.hidden = services.length > 0;
  if (services.length === 0) catalogStatus.textContent = "Todavía no hay comisiones disponibles.";
}

async function loadCatalog() {
  try {
    const response = await fetch(`${catalogApiBase}/services`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudieron cargar las comisiones.");
    if (!Array.isArray(result.services)) throw new Error("La respuesta del catálogo no es válida.");
    renderCatalog(result.services);
  } catch (error) {
    console.error("No se pudo cargar el catálogo de comisiones:", error);
    catalogStatus.hidden = false;
    catalogStatus.textContent = error instanceof Error ? error.message : "No se pudieron cargar las comisiones.";
  }
}

void loadCatalog();
