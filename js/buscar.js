const PAGE_SIZE = 10;
let currentPage = 1;
let allListings = [];

document.addEventListener("DOMContentLoaded", async () => {
  const categoryButtons = document.querySelectorAll(".option");
  const nationalityFilter = document.getElementById("nationalityFilter");
  const classFilter = document.getElementById("classFilter");
  const classFilterWrapper = document.getElementById("classFilterWrapper");
  const applyButton = document.getElementById("applyFilters");
  const listingGrid = document.getElementById("listingGrid");

  const syncCategoryUI = () => {
    const selectedCategory = document.querySelector(".option.active")?.dataset.category || "player";

    if (classFilterWrapper) {
      classFilterWrapper.style.display = selectedCategory === "player" ? "" : "none";
    }

    if (classFilter && selectedCategory !== "player") {
      classFilter.value = "";
    }
  };

  const loadListings = async () => {
    const selectedCategory = document.querySelector(".option.active")?.dataset.category || "player";

    let query = supabaseClient
      .from("listings")
      .select("*")
      .eq("status", "active")
      .eq("category", selectedCategory);

    if (selectedCategory === "player" && classFilter && classFilter.value) {
      query = query.eq("class_name", classFilter.value);
    }

    if (nationalityFilter && nationalityFilter.value) {
      query = query.eq("nationality", nationalityFilter.value);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }

    allListings = data || [];
    renderPage(1);
  };

  function renderPage(page) {
    currentPage = page;
    const totalPages = Math.max(1, Math.ceil(allListings.length / PAGE_SIZE));

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageItems = allListings.slice(start, end);

    if (!listingGrid) return;

    if (!pageItems.length) {
      listingGrid.innerHTML = "<p>No hay publicaciones.</p>";
      renderPagination(totalPages, page);
      return;
    }

    listingGrid.innerHTML = pageItems
      .map((item) => {
        const paymentMethods = getPaymentMethods(item.payment_methods);
        const paymentText = paymentMethods.length ? paymentMethods.join(", ") : "Sin métodos definidos";

        const roleList = parseRoleList(item.player_roles || []);
        const professionList = parseProfessionServices(item.player_professions || []);

        const roleText =
          roleList.length > 0
            ? roleList.map((r) => `${capitalizeRole(r.role)}${r.gs ? ` ${r.gs}` : ""}`).join(" • ")
            : "Sin roles definidos";

        const professionText =
          professionList.length > 0
            ? professionList
                .map((p) => `• ${p.name}${p.price !== null ? ` — ${p.price}` : ""}`)
                .join("<br>")
            : "Sin profesiones";

        let extraInfo = `
          <p>Precio: ${item.price}</p>
          
          <p>Métodos: ${paymentText}</p>
        `;

        if (item.category === "player") {
          extraInfo = `
            <p>Clase: ${item.class_name || "General"}</p>
            <p>Roles: ${roleText}</p>
            <p>Profesiones:<br>${professionText}</p>
            <p>Precio: ${item.price}</p>
            
            <p>Métodos: ${paymentText}</p>
          `;
        }

        if (item.category === "oro") {
          extraInfo = `
            <p>Oro: ${item.amount || "No especificado"}</p>
            <p>Precio: ${item.price}</p>
            <p>Métodos: ${paymentText}</p>
          `;
        }

        if (item.category === "donacion") {
          extraInfo = `
            <p>Puntos: ${item.amount || "No especificado"}</p>
            <p>Precio: ${item.price}</p>
            <p>Métodos: ${paymentText}</p>
          `;
        }

        if (item.category === "leveling") {
          extraInfo = `
            <p>Nombre: ${item.service_name || item.title || "No especificado"}</p>
            <p>Tiempo: ${item.service_time || "No especificado"}</p>
            <p>Precio: ${item.price}</p>
            <p>Métodos: ${paymentText}</p>
          `;
        }

        if (item.category === "profession") {
          extraInfo = `
            <p>Profesiones:<br>${professionText}</p>
            <p>Tiempo: ${item.service_time || "No especificado"}</p>
            <p>Métodos: ${paymentText}</p>
          `;
        }

        return `
          <article class="listing-card">
            <img
              src="${getListingImage(item)}"
              alt="${item.title || "Oferta"}"
            />
            <div class="listing-body">
              <div class="badge-row">
                <span class="small-badge">${item.category}</span>
                ${item.category === "player" ? `<span class="small-badge">${item.class_name || "General"}</span>` : ""}
              </div>
              <h3>${item.title || "Oferta"}</h3>
              ${extraInfo}
              <p>Nacionalidad: ${item.nationality || "No especificada"}</p>
              <a href="listing-detail.html?id=${item.id}" class="btn small primary">Ver detalles</a>
            </div>
          </article>
        `;
      })
      .join("");

    renderPagination(totalPages, page);
  }

  function renderPagination(totalPages, activePage) {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(`
        <button class="page-btn ${i === activePage ? "active" : ""}" data-page="${i}" type="button">
          ${i}
        </button>
      `);
    }

    pagination.innerHTML = pages.join("");

    pagination.querySelectorAll(".page-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const page = Number(button.dataset.page);
        renderPage(page);
      });
    });
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      categoryButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      syncCategoryUI();
      loadListings();
    });
  });

  applyButton?.addEventListener("click", () => {
    loadListings();
  });

  classFilter?.addEventListener("change", () => {
    loadListings();
  });

  nationalityFilter?.addEventListener("change", () => {
    loadListings();
  });

  syncCategoryUI();
  await loadListings();
});