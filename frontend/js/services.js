document.querySelectorAll(".order").forEach((order) => {
  const tiers = Array.from(order.querySelectorAll(".tier"));
  const panes = Array.from(order.querySelectorAll(".pane"));
  const addOns = Array.from(order.querySelectorAll(".license-option input[data-rate]"));
  const total = order.querySelector("[data-total]");
  const requestLink = order.querySelector("[data-request-link]");

  const updateTotal = () => {
    const pane = panes.find((item) => item.classList.contains("on"));
    if (!pane || !total) return;

    const basePrice = Number(pane.dataset.price);
    const addOnRate = addOns.reduce((rate, input) => (
      input.checked ? rate + Number(input.dataset.rate) : rate
    ), 0);
    total.textContent = `$${(basePrice * (1 + addOnRate)).toFixed(2)} USD`;

    if (!requestLink) return;

    const tier = tiers.find((button) => button.dataset.tier === pane.dataset.tier);
    const facts = Array.from(pane.querySelectorAll(".facts span"));
    const params = new URLSearchParams({
      service: order.dataset.service,
      category: order.querySelector(".order-category").textContent.trim(),
      title: order.querySelector("h1").textContent.trim(),
      package: tier.textContent.trim(),
      tier: pane.dataset.tier,
      description: pane.querySelector("p").textContent.trim(),
      delivery: facts[0].textContent.replace("Entrega:", "").trim(),
      included: facts[1].textContent.replace("Incluye:", "").trim()
    });

    addOns.forEach((input) => {
      params.set(input.dataset.license, String(input.checked));
    });
    requestLink.href = `portal.html?${params.toString()}`;
  };

  tiers.forEach((button) => {
    button.addEventListener("click", () => {
      tiers.forEach((tier) => tier.setAttribute("aria-pressed", String(tier === button)));
      panes.forEach((pane) => pane.classList.toggle("on", pane.dataset.tier === button.dataset.tier));
      updateTotal();
    });
  });

  addOns.forEach((input) => input.addEventListener("change", updateTotal));
  updateTotal();
});
