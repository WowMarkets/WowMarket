let sellerDisplayName = "Vendedor";
let currentListing = null;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const currentUser = getCurrentUser();

  try {
    const { data, error } = await supabaseClient
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    currentListing = data;

    const { data: sellerInfo, error: sellerInfoError } = await supabaseClient
      .from("users")
      .select("full_name, username, phone")
      .eq("id", data.user_id)
      .maybeSingle();

    if (!sellerInfoError && sellerInfo) {
      sellerDisplayName = sellerInfo.full_name || sellerInfo.username || "Vendedor";
    }

    const sellerPhone =
      sellerInfo?.phone ||
      data.seller_phone ||
      data.seller_whatsapp ||
      "";

    const cleanPhone = (sellerPhone || "").replace(/\D/g, "");

    const whatsappHref = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          "Hola, vi tu oferta en WoW Market. ¿Podemos hablar?"
        )}`
      : "#";

    const methods = getPaymentMethods(data.payment_methods);
    const paymentText = methods.length ? methods.join(", ") : "Sin métodos definidos";

    const roleList = parseRoleList(data.player_roles || []);
    const professionList = parseProfessionServices(data.player_professions || []);

    const roleText =
      roleList.length > 0
        ? roleList.map((r) => `${capitalizeRole(r.role)}${r.gs ? `: ${r.gs}` : ""}`).join(" • ")
        : "Sin roles definidos";

    const professionText =
      professionList.length > 0
        ? professionList
            .map((p) => `• ${p.name}${p.price !== null ? ` — ${p.price}` : ""}`)
            .join("<br>")
        : "Sin profesiones";

    const reviews = await fetchReviewsForSeller(data.user_id);
    const averageRating = getAverageRating(reviews);
    const userAlreadyReviewed = currentUser ? reviews.some((r) => r.buyer_id === currentUser.id) : false;

    const container = document.getElementById("listingDetail");
    if (!container) return;

    const isPlayer = data.category === "player";
    const isOro = data.category === "oro";
    const isDonacion = data.category === "donacion";
    const isLeveling = data.category === "leveling";
    const isProfession = data.category === "profession";

    let extraInfo = "";

    if (isPlayer) {
      extraInfo = `
        <p><strong>Clase:</strong> ${data.class_name || "General"}</p>
        <p><strong>Roles y GS:</strong> ${roleText}</p>
        <p><strong>Profesiones:</strong><br>${professionText}</p>
      `;
    }

    if (isOro) {
      extraInfo = `
        <p><strong>Cantidad de oro:</strong> ${data.amount || "No especificada"}</p>
        <p><strong>Precio por 1000 oro:</strong> ${data.price || "No especificado"}</p>
      `;
    }

    if (isDonacion) {
      extraInfo = `
        <p><strong>Puntos de donación:</strong> ${data.amount || "No especificado"}</p>
        <p><strong>Precio:</strong> ${data.price || "No especificado"}</p>
      `;
    }

    if (isLeveling) {
      extraInfo = `
        <p><strong>Nombre del personaje:</strong> ${data.service_name || data.title || "No especificado"}</p>
        <p><strong>Tiempo estimado:</strong> ${data.service_time || "No especificado"}</p>
        <p><strong>Precio:</strong> ${data.price || "No especificado"}</p>
      `;
    }

    if (isProfession) {
      extraInfo = `
        <p><strong>Profesiones:</strong><br>${professionText}</p>
        <p><strong>Tiempo estimado:</strong> ${data.service_time || "No especificado"}</p>
      `;
    }

    const reviewBlock = `
      <div class="reviews-section">
        <div class="reviews-header">
          <h3>Reseñas del vendedor</h3>

          <div class="rating-block">
            <div class="rating-stars">${renderStarHtml(averageRating)}</div>
            <span class="rating-score">${averageRating.toFixed(1)}</span>
            <span class="rating-meta">(${reviews.length} reseñas)</span>
          </div>
        </div>

        ${renderReviewsList(reviews)}

        ${
          currentUser
            ? currentUser.id === data.user_id
              ? `
                <div class="review-note">
                  <p>Este es tu anuncio, no puedes dejarte reseña a ti mismo.</p>
                </div>
              `
              : userAlreadyReviewed
                ? `
                  <div class="review-note">
                    <p>Ya dejaste una reseña para este vendedor.</p>
                  </div>
                `
                : `
                  <form id="reviewForm" class="review-form">
                    <label>Tu valoración</label>

                    <div class="review-rating-picker" aria-label="Selecciona tu puntuación">
                      ${[5, 4, 3, 2, 1]
                        .map(
                          (score) => `
                            <button
                              type="button"
                              class="review-star-btn"
                              data-score="${score}"
                              aria-label="${score} estrellas"
                            >★</button>
                          `
                        )
                        .join("")}
                    </div>

                    <input type="hidden" name="score" id="reviewScore" value="5" />

                    <textarea
                      name="comment"
                      id="reviewComment"
                      placeholder="Escribe tu opinión sobre este vendedor..."
                      rows="4"
                      required
                    ></textarea>

                    <button type="submit" class="btn primary">Enviar reseña</button>
                  </form>
                `
            : `
              <div class="review-note">
                <p>Inicia sesión para dejar una reseña.</p>
                <a href="login.html" class="btn secondary">Iniciar sesión</a>
              </div>
            `
        }

        <div class="report-container">
          <button
            type="button"
            class="btn danger report-btn"
            data-report-seller="${data.user_id}"
          >
            Reportar vendedor
          </button>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="detail-grid">
        <img
          src="${getListingImage(data)}"
          alt="${data.title || "Oferta"}"
        />
        <div>
          <h2>${data.title || "Oferta"}</h2>
          <p><strong>Categoría:</strong> ${data.category}</p>
          ${extraInfo}
          <p><strong>Precio:</strong> ${data.price}</p>
          <p><strong>País:</strong> ${data.country || "No especificado"}</p>
          <p><strong>Nacionalidad:</strong> ${data.nationality || "No especificada"}</p>
          <p><strong>Métodos de pago:</strong> ${paymentText}</p>
          <p><strong>Descripción:</strong> ${data.description || "Sin descripción"}</p>

         <div class="premium-actions">
          <a
            href="${whatsappHref}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn primary"
          >
            Contactar vendedor
          </a>

          <a
            href="${whatsappHref}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn secondary"
          >
            WhatsApp
          </a>
        </div>

      ${reviewBlock}
    `;

    bindReviewStars();
    bindReviewForm(data, currentUser);
    bindReportSellerButton();
  } catch (err) {
    console.error("Error cargando oferta:", err);
  }
});

function fetchReviewsForSeller(sellerId) {
  if (!sellerId) return Promise.resolve([]);

  return supabaseClient
    .from("reviews")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) {
        console.error("Error cargando reseñas:", error);
        return [];
      }

      return data || [];
    });
}

function renderReviewsList(reviews) {
  if (!reviews || reviews.length === 0) {
    return `
      <div class="review-empty">
        <p>Aún no hay reseñas para este vendedor.</p>
      </div>
    `;
  }

  return `
    <div class="reviews-list">
      ${reviews
        .map((review) => {
          const score = Number(review.score || 0);
          const date = review.created_at
            ? new Date(review.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric"
              })
            : "Reciente";

          return `
            <div class="review-card">
              <div class="review-header">
                <div class="review-stars">
                  ${renderStarHtml(score)}
                </div>

                <span class="review-date">${date}</span>
              </div>

              <div class="review-text">
                ${review.comment || "Sin comentario."}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderStarHtml(value) {
  const safeValue = Math.min(5, Math.max(0, Number(value || 0)));
  const rounded = Math.round(safeValue);

  return Array.from({ length: 5 }, (_, index) => {
    const filled = index < rounded;
    return `<span class="star ${filled ? "filled" : ""}">★</span>`;
  }).join("");
}

function getAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const total = reviews.reduce((sum, review) => sum + Number(review.score || 0), 0);
  return total / reviews.length;
}

function bindReviewStars() {
  const buttons = document.querySelectorAll(".review-star-btn");
  const hiddenInput = document.getElementById("reviewScore");

  if (!hiddenInput || !buttons.length) return;

  const updateActiveStars = (selectedScore) => {
    buttons.forEach((btn) => {
      const btnScore = Number(btn.dataset.score || 0);
      const isActive = btnScore <= selectedScore;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const score = Number(button.dataset.score || 5);
      hiddenInput.value = String(score);
      updateActiveStars(score);
    });
  });

  const initialValue = Number(hiddenInput.value || 5);
  updateActiveStars(initialValue);
}

function bindReviewForm(listing, currentUser) {
  const form = document.getElementById("reviewForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      window.location.href = "login.html";
      return;
    }

    const score = Number(form.querySelector("#reviewScore")?.value || 5);
    const comment = form.querySelector("#reviewComment")?.value?.trim() || "";

    if (!comment) {
      alert("Debes escribir un comentario.");
      return;
    }

    if (!listing?.user_id) {
      alert("No se pudo identificar al vendedor.");
      return;
    }

    try {
      const { error } = await supabaseClient
        .from("reviews")
        .insert([
          {
            seller_id: listing.user_id,
            buyer_id: currentUser.id,
            score,
            comment,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error("Error guardando reseña:", error);
        alert("No se pudo guardar la reseña. Revisa la política de seguridad de Supabase.");
        return;
      }

      alert("Gracias por tu reseña.");
      location.reload();
    } catch (err) {
      console.error("Error al enviar reseña:", err);
      alert("Hubo un error al enviar la reseña.");
    }
  });
}

function bindReportSellerButton() {
  const reportBtn = document.querySelector(".report-btn");
  if (!reportBtn) return;

  reportBtn.addEventListener("click", () => {
    const sellerId = reportBtn.dataset.reportSeller;
    const listingId = new URLSearchParams(window.location.search).get("id");

    if (!sellerId) {
      alert("No se pudo identificar al vendedor.");
      return;
    }

    const sellerName = encodeURIComponent(sellerDisplayName || "Vendedor");
    const listingTitle = encodeURIComponent(currentListing?.title || "Oferta");

    window.location.href =
      `report.html?seller_id=${encodeURIComponent(sellerId)}&listing_id=${encodeURIComponent(listingId || "")}&seller_name=${sellerName}&listing_title=${listingTitle}`;
  });
}