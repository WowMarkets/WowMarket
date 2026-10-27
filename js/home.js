document.addEventListener("DOMContentLoaded", async () => {
  const listingGrid = document.getElementById("listingGrid");

  async function loadPremiumHomeCarousel() {
    if (window.syncPremiumPromotions) {
      await window.syncPremiumPromotions();
    }

    const nowIso = new Date().toISOString();

    const { data: promos, error } = await supabaseClient
      .from("premium_promotions")
      .select("*, listings(*)")
      .eq("status", "active")
      .gte("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error(error);
      return;
    }

    if (!listingGrid) return;

    if (!promos || promos.length === 0) {
      listingGrid.innerHTML = `
        <div class="premium-empty-state">
          <h3>Promociones premium</h3>
          <p>No hay promociones activas por el momento.</p>
        </div>
      `;
      return;
    }

    const items = promos
      .map((promo) => promo.listings)
      .filter(Boolean);

    if (!items.length) {
      listingGrid.innerHTML = `
        <div class="premium-empty-state">
          <h3>Promociones premium</h3>
          <p>No hay promociones activas por el momento.</p>
        </div>
      `;
      return;
    }

    const categoryMap = {
      player: { label: "Player", color: "player" },
      oro: { label: "Oro", color: "oro" },
      donacion: { label: "Donación", color: "donacion" },
      leveling: { label: "Leveling", color: "leveling" },
      profession: { label: "Profesiones", color: "profession" }
    };

    let index = 0;

    const buildCard = (item) => {
      const categoryInfo = categoryMap[item.category] || { label: "Oferta", color: "default" };
      const categoryLabel = categoryInfo.label;

      const sellerPhone = item.seller_phone || item.seller_whatsapp || "";
      const whatsappHref = sellerPhone
        ? `https://wa.me/${sellerPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, vi tu oferta promocionada en WoW Market. ¿Podemos hablar?")}`
        : "#";

      const methods = getPaymentMethods(item.payment_methods);
      const paymentText = methods.length ? methods.join(", ") : "Sin métodos definidos";

      const roleList = parseRoleList(item.player_roles || []);
      const professionList = parseProfessionList(item.player_professions || []);

      const roleText =
        roleList.length > 0
          ? roleList
              .map((r) => `${capitalizeRole(r.role)}${r.gs ? ` ${r.gs}` : ""}`)
              .join(" • ")
          : "Sin roles definidos";

      const professionText =
        professionList.length > 0
          ? professionList.join(", ")
          : "Sin profesiones";

      const imageUrl = getListingImage(item);

      return `
        <article class="premium-featured-card premium-${categoryInfo.color}">
          <div class="premium-featured-image">
            <img src="${imageUrl}" alt="${item.title || "Oferta premium"}" />
            <div class="premium-image-overlay"></div>
            <span class="premium-badge">Premium</span>
          </div>

          <div class="premium-featured-content">
            <div class="premium-topline">
              <span class="premium-type">${categoryLabel}</span>
              <span class="premium-status">Oferta destacada</span>
            </div>

            <h3>${item.title || "Oferta premium"}</h3>

            <div class="premium-meta-grid">
              <div>
                <span>País</span>
                <strong>${item.country || "No especificado"}</strong>
              </div>
              <div>
                <span>Clase</span>
                <strong>${item.class_name || (item.category === "player" ? "General" : categoryLabel)}</strong>
              </div>
              <div>
                <span>Precio</span>
                <strong>${item.price || "No indicado"}</strong>
              </div>
              <div>
                <span>Pago</span>
                <strong>${paymentText}</strong>
              </div>
            </div>

            <div class="premium-focus-row">
              <p><strong>Roles:</strong> ${roleText}</p>
              <p><strong>Profesiones:</strong> ${professionText}</p>
            </div>

            <div class="premium-actions">
              <a href="listing-detail.html?id=${item.id}" class="btn primary">
                Ver detalles
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
          </div>
        </article>
      `;
    };

    const renderSlide = () => {
      const item = items[index];
      if (!item) return;

      listingGrid.innerHTML = buildCard(item);

      const dotsWrap = document.createElement("div");
      dotsWrap.className = "premium-dots";

      const dotsHtml = items
        .map((_, i) => {
          const activeClass = i === index ? "active" : "";
          return `<span class="premium-dot ${activeClass}" data-index="${i}"></span>`;
        })
        .join("");

      dotsWrap.innerHTML = dotsHtml;

      const card = listingGrid.querySelector(".premium-featured-card");
      if (card) {
        card.appendChild(dotsWrap);
      }

      dotsWrap.querySelectorAll(".premium-dot").forEach((dot) => {
        dot.addEventListener("click", () => {
          index = Number(dot.dataset.index);
          renderSlide();
        });
      });

      index = (index + 1) % items.length;
    };

    renderSlide();
    setInterval(renderSlide, 10000);
  }

  await loadPremiumHomeCarousel();
});