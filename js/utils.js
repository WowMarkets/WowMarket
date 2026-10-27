function saveUserSession(session) {
  if (!session) return;
  localStorage.setItem("app_session", JSON.stringify(session));
}

function getCurrentUser() {
  const raw = localStorage.getItem("app_session");
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    return session?.user || null;
  } catch {
    return null;
  }
}

function getSavedSession() {
  const raw = localStorage.getItem("app_session");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearUserSession() {
  localStorage.removeItem("app_session");
}

function isMembershipActive(userData) {
  if (!userData) return false;
  if (userData.is_banned) return false;

  if (!userData.membership_expires_at) return false;

  const expiresAt = new Date(userData.membership_expires_at);
  const now = new Date();

  return expiresAt > now;
}

function getMembershipCountdownLabel(dateString) {
  if (!dateString) return "Sin membresía activa";

  const expiresAt = new Date(dateString);
  const now = new Date();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return "Membresía vencida";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m restantes`;
}

function parseList(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") return parsed ? [parsed] : [];
      return [];
    } catch {
      return text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function parseRoleList(value) {
  const list = parseList(value);

  return list
    .map((item) => {
      if (typeof item === "string") {
        return { role: item, gs: "" };
      }

      if (item && typeof item === "object") {
        return {
          role: item.role || "",
          gs: item.gs !== undefined && item.gs !== null ? Number(item.gs) : ""
        };
      }

      return null;
    })
    .filter((item) => item && item.role);
}

function parseProfessionList(value) {
  const list = parseList(value);

  return list
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return item.name || item.profession || "";
      return "";
    })
    .filter(Boolean);
}

function capitalizeRole(role) {
  if (!role) return "Rol";

  const map = {
    caster: "Caster",
    heal: "Heal",
    melee: "Melee",
    tank: "Tank"
  };

  return map[role.toLowerCase()] || role;
}

function getPaymentMethods(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") return parsed ? [parsed] : [];
      return [];
    } catch {
      return text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

const DEFAULT_LISTING_IMAGES = {
  oro: "assets/default-oro.png",
  donacion: "assets/default-donacion.png",
  leveling: "assets/default-leveling.png",
  profession: "assets/default-profession.png"
};

function getDefaultListingImage(category) {
  return DEFAULT_LISTING_IMAGES[category] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80";
}

function getListingImage(item) {
  if (!item) {
    return "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80";
  }

  if (item.category === "player" && item.image_url) {
    return item.image_url;
  }

  if (item.image_url) {
    return item.image_url;
  }

  if (item.category && DEFAULT_LISTING_IMAGES[item.category]) {
    return DEFAULT_LISTING_IMAGES[item.category];
  }

  return "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80";
}

function parseProfessionServices(value) {
  const list = parseList(value);

  return list
    .map((item) => {
      if (typeof item === "string") {
        return { name: item.trim(), price: null };
      }

      if (item && typeof item === "object") {
        return {
          name: item.name || item.profession || item.title || "",
          price: item.price !== undefined && item.price !== null ? Number(item.price) : null
        };
      }

      return null;
    })
    .filter((item) => item && item.name);
}

function createStarsMarkup(rating) {
  const rounded = Math.round(Number(rating || 0));
  const full = "★".repeat(Math.max(0, rounded));
  const empty = "☆".repeat(Math.max(0, 5 - rounded));
  return `${full}${empty}`;
}

function getSellerRatingLabel(rating) {
  const value = Number(rating || 0);
  if (value >= 4.5) return "Muy fiable";
  if (value >= 4) return "Buena reputación";
  if (value >= 3) return "Aceptable";
  return "Sin reseñas";
}

function isWelcomeTrialActive(userData) {
  if (!userData) return false;

  if (userData.membership_status === "welcome" && userData.membership_expires_at) {
    const expiresAt = new Date(userData.membership_expires_at);
    const now = new Date();
    return expiresAt > now;
  }

  return false;
}

function getWelcomeTrialStatus(userData) {
  if (!userData) return "Sin acceso";

  if (userData.membership_status === "welcome") {
    if (userData.membership_expires_at) {
      const expiresAt = new Date(userData.membership_expires_at);
      const now = new Date();

      if (expiresAt > now) {
        const diffMs = expiresAt - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return `Prueba gratis: ${diffDays} días restantes`;
      }

      return "Prueba gratis vencida";
    }

    return "Prueba gratis activa";
  }

  return "Sin prueba gratis";
}