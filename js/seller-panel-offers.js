async function renderOffers(userData) {
  const offersContent = document.getElementById("offersContent");
  if (!offersContent) return;

  const listings = await fetchSellerListings(userData.id);
  const groups = { player: [], oro: [], donacion: [] };

  (listings || []).forEach((item) => {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  });

  const categories = ["player", "oro", "donacion"];

  offersContent.innerHTML = `
    <div class="dashboard-tabs">
      ${categories.map((category, index) => `
        <button class="offer-tab-btn ${index === 0 ? "active" : ""}" data-offer-tab="${category}" type="button">
          ${category === "player" ? "Player" : category === "oro" ? "Oro" : "Puntos de donación"}
        </button>
      `).join("")}
    </div>

    ${categories.map((category, index) => {
      const items = groups[category] || [];
      const rows = items.length
        ? items.map((item) => {
            const methods = getPaymentMethods(item.payment_methods);
            const paymentText = methods.length ? methods.join(", ") : "Sin métodos definidos";

            const roleList = parseRoleList(item.player_roles || []);
            const professionList = parseProfessionList(item.player_professions || []);

            const roleText =
              roleList.length > 0
                ? roleList
                    .map((r) => `${capitalizeRole(r.role)}${r.gs ? `: ${r.gs}` : ""}`)
                    .join(" • ")
                : "Sin roles definidos";

            const professionText =
              professionList.length > 0
                ? professionList.join(", ")
                : "Sin profesiones";

            return `
              <div class="payment-item">
                <h4>${item.title || "Oferta sin título"}</h4>

                ${item.category === "player" ? `
                  <p>Clase: ${item.class_name || "General"}</p>
                  <p>Roles y GS: ${roleText}</p>
                  <p>Profesiones: ${professionText}</p>
                ` : ""}

                <p>Precio: ${item.price || "No especificado"}</p>
                <p>Cantidad: ${item.amount || "No especificada"}</p>
                <p>País: ${item.country || "No especificado"}</p>
                <p>Métodos: ${paymentText}</p>

                <div class="offer-actions">
                  <button class="btn secondary" data-toggle-listing="${item.id}" data-action="pause" type="button">
                    Bajar
                  </button>

                  <button class="btn danger" data-toggle-listing="${item.id}" data-action="delete" type="button">
                    Quitar oferta
                  </button>
                </div>
              </div>
            `;
          }).join("")
        : `
          <div class="payment-item">
            <p>No tienes ofertas de ${category === "player" ? "Player" : category === "oro" ? "Oro" : "Donación"}</p>
          </div>
        `;

      return `
        <div class="offer-tab-panel ${index === 0 ? "active" : ""}" data-offer-panel="${category}">
          <div class="offer-list">
            ${rows}
          </div>
        </div>
      `;
    }).join("")}
  `;

  document.querySelectorAll(".offer-tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.offerTab;

      document.querySelectorAll(".offer-tab-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".offer-tab-panel").forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      document.querySelector(`[data-offer-panel="${target}"]`)?.classList.add("active");
    });
  });

  document.querySelectorAll("[data-toggle-listing]").forEach((button) => {
    button.addEventListener("click", async () => {
      const listingId = button.dataset.toggleListing;
      const action = button.dataset.action;

      if (!listingId) return;

      if (action === "pause") {
        const { error } = await supabaseClient
          .from("listings")
          .update({ status: "inactive" })
          .eq("id", listingId)
          .eq("user_id", userData.id);

        if (error) {
          console.error(error);
          alert("No se pudo bajar la oferta.");
          return;
        }

        alert("Oferta bajada correctamente.");
        window.location.reload();
        return;
      }

      if (action === "delete") {
        const confirmDelete = confirm("¿Seguro que quieres quitar esta oferta?");

        if (!confirmDelete) return;

        const { error } = await supabaseClient
          .from("listings")
          .delete()
          .eq("id", listingId)
          .eq("user_id", userData.id);

        if (error) {
          console.error(error);
          alert("No se pudo quitar la oferta.");
          return;
        }

        alert("Oferta quitada correctamente.");
        window.location.reload();
      }
    });
  });
}