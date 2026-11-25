const apiBaseUrl = window.ARTFOLIO_CONFIG.apiBaseUrl.replace(/\/$/, "");
const profileParams = new URLSearchParams(window.location.search);
const profileId = profileParams.get("id");
const editButton = document.getElementById("edit-profile-button");
const manageServicesButton = document.getElementById("manage-services-button");

if (editButton) editButton.hidden = true;
if (manageServicesButton) manageServicesButton.hidden = true;

function getAccessToken() {
  return sessionStorage.getItem("artfolioToken") || localStorage.getItem("artfolioToken");
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function updateProfileAvatar(name, avatarUrl) {
  const avatar = document.getElementById("profile-avatar");
  if (!avatarUrl) {
    avatar.textContent = getInitials(name);
    return;
  }

  const image = document.createElement("img");
  image.src = avatarUrl;
  image.alt = "";
  avatar.replaceChildren(image);
}

function updateProfileBanner(bannerUrl) {
  const banner = document.getElementById("profile-banner-image");
  if (!bannerUrl) {
    banner.removeAttribute("src");
    banner.hidden = true;
    return;
  }

  banner.src = bannerUrl;
  banner.hidden = false;
}

async function loadProfile() {
  const token = getAccessToken();
  let profile = null;
  let selfProfile = null;

  if (token) {
    try {
      const selfResponse = await fetch(`${apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selfResponse.ok) selfProfile = (await selfResponse.json()).user;
    } catch {
      // The public fallback remains visible if the session cannot be validated.
    }
  }

  if (profileId) {
    try {
      const response = await fetch(`${apiBaseUrl}/users/${encodeURIComponent(profileId)}`);
      if (response.ok) profile = (await response.json()).user;
    } catch {
      profile = null;
    }
  } else {
    try {
      const response = await fetch(`${apiBaseUrl}/users/artist`);
      if (response.ok) profile = (await response.json()).user;
    } catch {
      profile = null;
    }
  }

  if (!profile) return;

  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById("profile-handle").textContent = `@${profile.handle}`;
  document.getElementById("profile-title").textContent = profile.artistTitle;
  document.getElementById("profile-bio").textContent = profile.bio;
  document.getElementById("profile-response").textContent = profile.responseTime;
  updateProfileAvatar(profile.name, profile.avatarUrl);
  updateProfileBanner(profile.bannerUrl);

  const ownsProfile = selfProfile && profile.id === selfProfile.id;
  const canEdit = ownsProfile && (selfProfile.role === "admin" || selfProfile.role === "artist");
  if (editButton) editButton.hidden = !canEdit;
  if (manageServicesButton) manageServicesButton.hidden = !canEdit;
}

loadProfile();
