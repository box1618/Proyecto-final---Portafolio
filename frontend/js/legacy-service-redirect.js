const legacyServiceSlugs = {
  "concept-art.html": "concept-art",
  "art.html": "dibujo-renderizado",
  "animation-art.html": "animacion-2d"
};
const legacyPage = window.location.pathname.split("/").pop();
const currentServiceSlug = legacyServiceSlugs[legacyPage];

if (currentServiceSlug) {
  window.location.replace(`service.html?slug=${encodeURIComponent(currentServiceSlug)}`);
}
