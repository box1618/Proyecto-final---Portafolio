const artworkImage = document.querySelector("#rendered-artwork");
const artworkImageStatus = document.querySelector("#artwork-image-status");
const artworkApiBase = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");

async function loadRenderedArtwork() {
  try {
    const response = await fetch(`${artworkApiBase}/artworks?category=art`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "No se pudo cargar el artwork.");
    }

    const artwork = result.artworks[0];
    if (!artwork) {
      artworkImageStatus.hidden = false;
      artworkImageStatus.textContent = "Todavía no hay una imagen publicada en Dibujo renderizado.";
      return;
    }

    artworkImage.src = artwork.imageUrl;
    artworkImage.alt = artwork.title || "Artwork de dibujo renderizado";
    artworkImage.hidden = false;
    artworkImageStatus.hidden = true;
  } catch (error) {
    console.error("No se pudo cargar la imagen del artwork:", error);
    artworkImageStatus.hidden = false;
    artworkImageStatus.textContent = "No se pudo cargar la imagen. Verifica que el backend esté conectado a MongoDB.";
  }
}

void loadRenderedArtwork();
