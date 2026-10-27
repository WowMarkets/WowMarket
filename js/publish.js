document.addEventListener("DOMContentLoaded", async () => {
  const publishForm = document.getElementById("publishForm");
  const categoryTabs = document.querySelectorAll(".publish-tab");
  const categoryPanels = document.querySelectorAll(".publish-panel");

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const fetchUserProfile = async () => {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data;
  };

  const userProfile = await fetchUserProfile();

  if (!userProfile) {
    alert("Tu perfil no existe.");
    window.location.href = "login.html";
    return;
  }

  const hasTrial = isWelcomeTrialActive(userProfile);
  const hasPaidMembership = isMembershipActive(userProfile);

  if (!hasTrial && !hasPaidMembership) {
    alert("Tu prueba gratuita de 3 días ha terminado. Debes pagar la membresía para seguir usando la app.");
    window.location.href = "seller-panel.html#promotions";
    return;
  }

  const setCategory = (category) => {
    categoryTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.category === category);
    });

    categoryPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.category === category);
    });
  };

  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", () => setCategory(tab.dataset.category));
  });

  const getSelectedCategory = () => {
    const activeTab = document.querySelector(".publish-tab.active");
    return activeTab ? activeTab.dataset.category : "player";
  };

  const normalizePaymentMethods = () => {
    const items = document.querySelectorAll(".payment-method-input");
    const values = [];

    items.forEach((input) => {
      const value = input.value.trim();
      if (value) values.push(value);
    });

    return values;
  };

  const buildRoleList = () => {
    const rows = [];
    document.querySelectorAll(".player-role-row").forEach((row) => {
      const role = row.querySelector(".player-role-select")?.value?.trim();
      const gs = row.querySelector(".player-role-gs")?.value?.trim();

      if (role) {
        rows.push({
          role,
          gs: gs || null
        });
      }
    });

    return rows;
  };

  const buildProfessions = () => {
    const arr = [];
    document.querySelectorAll(".player-profession-input").forEach((input) => {
      const value = input.value.trim();
      if (value) arr.push(value);
    });

    return arr;
  };

  const buildProfessionServices = () => {
    const rows = [];
    document.querySelectorAll(".profession-service-row").forEach((row) => {
      const name = row.querySelector(".profession-service-name")?.value?.trim();
      const price = row.querySelector(".profession-service-price")?.value?.trim();

      if (name && price) {
        rows.push({
          name,
          price: Number(price)
        });
      }
    });

    return rows;
  };

  const addPlayerRoleRow = () => {
    const container = document.getElementById("playerRolesList");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "player-role-row";

    row.innerHTML = `
      <select class="player-role-select">
        <option value="">Rol</option>
        <option value="caster">Caster</option>
        <option value="heal">Heal</option>
        <option value="melee">Melee</option>
      </select>
      <input type="number" class="player-role-gs" placeholder="GS" min="0" />
      <button type="button" class="remove-role-btn">X</button>
    `;

    row.querySelector(".remove-role-btn").addEventListener("click", () => {
      row.remove();
    });

    container.appendChild(row);
  };

  const addPlayerProfession = () => {
    const container = document.getElementById("playerProfessionsList");
    if (!container) return;

    const item = document.createElement("div");
    item.className = "player-profession-item";

    item.innerHTML = `
      <input type="text" class="player-profession-input" placeholder="Ej: Ingeniero" />
      <button type="button" class="remove-profession-btn">X</button>
    `;

    item.querySelector(".remove-profession-btn").addEventListener("click", () => {
      item.remove();
    });

    container.appendChild(item);
  };

  const addProfessionServiceRow = () => {
    const container = document.getElementById("professionServicesList");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "profession-service-row";

    row.innerHTML = `
      <input type="text" class="profession-service-name" placeholder="Ej: Ingeniería" />
      <input type="number" class="profession-service-price" placeholder="Precio" min="0" />
      <button type="button" class="remove-profession-service-btn">X</button>
    `;

    row.querySelector(".remove-profession-service-btn").addEventListener("click", () => {
      row.remove();
    });

    container.appendChild(row);
  };

  const addPlayerRoleBtn = document.getElementById("addPlayerRoleBtn");
  if (addPlayerRoleBtn) addPlayerRoleBtn.addEventListener("click", addPlayerRoleRow);

  const addPlayerProfessionBtn = document.getElementById("addPlayerProfessionBtn");
  if (addPlayerProfessionBtn) addPlayerProfessionBtn.addEventListener("click", addPlayerProfession);

  const addProfessionServiceBtn = document.getElementById("addProfessionServiceBtn");
  if (addProfessionServiceBtn) {
    addProfessionServiceBtn.addEventListener("click", addProfessionServiceRow);
  }

  document.querySelectorAll(".remove-role-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".player-role-row");
      if (row) row.remove();
    });
  });

  document.querySelectorAll(".remove-profession-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".player-profession-item");
      if (item) item.remove();
    });
  });

  document.querySelectorAll(".remove-profession-service-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest(".profession-service-row");
      if (row) row.remove();
    });
  });

  const addPaymentMethodBtn = document.getElementById("addPaymentMethodBtn");
  if (addPaymentMethodBtn) {
    addPaymentMethodBtn.addEventListener("click", () => {
      const container = document.getElementById("paymentMethodsList");
      if (!container) return;

      const item = document.createElement("div");
      item.className = "payment-method-item";

      item.innerHTML = `
        <input type="text" class="payment-method-input" placeholder="Ej: Transferencia, PayPal, Saldo..." />
      `;

      container.appendChild(item);
    });
  }

  const normalizeCategoryData = (category, formData) => {
    if (category === "leveling") {
      return {
        service_name: formData.get("level_name")?.toString().trim(),
        service_price: Number(formData.get("level_price") || 0),
        service_time: formData.get("level_time")?.toString().trim(),
        title: formData.get("level_name")?.toString().trim(),
        price: Number(formData.get("level_price") || 0),
        amount: 0
      };
    }

    if (category === "profession") {
      const professionName = formData.get("profession_name")?.toString().trim();
      return {
        service_name: professionName,
        service_price: Number(formData.get("profession_price") || 0),
        service_time: formData.get("profession_time")?.toString().trim(),
        title: professionName,
        price: Number(formData.get("profession_price") || 0),
        amount: 0
      };
    }

    return {
      service_name: "",
      service_price: 0,
      service_time: "",
      title: "",
      price: 0,
      amount: 0
    };
  };

  if (publishForm) {
    const submitBtn = publishForm.querySelector("button[type='submit']");

    publishForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      showGlobalLoader("Publicando oferta...");
      setButtonLoading(submitBtn, true, "Publicando...");

      try {
        const formData = new FormData(publishForm);
        const category = getSelectedCategory();
        const nationality = formData.get("nationality")?.toString().trim();

        if (!nationality) {
          alert("Debes seleccionar una nacionalidad para la publicación.");
          return;
        }

        const extraData = normalizeCategoryData(category, formData);
        const professionServices = buildProfessionServices();
        const professionTotal = professionServices.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

        let uploadedImageUrl = "";

        if (category === "player") {
          const fileInput = formData.get("playerImage");
          if (fileInput && typeof fileInput !== "string" && fileInput.size > 0) {
            const file = fileInput;
            const safeName = file.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
            const fileName = `${Date.now()}-${safeName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
              .from("payments")
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false
              });

            if (uploadError) {
              console.error("Error subiendo imagen:", uploadError);
              alert("No se pudo subir la foto de la oferta.");
              return;
            }

            const { data: publicUrlData } = supabaseClient.storage
              .from("payments")
              .getPublicUrl(uploadData.path);

            uploadedImageUrl = publicUrlData?.publicUrl || "";
          }
        }

        const finalImageUrl =
          category === "player"
            ? uploadedImageUrl || "assets/default-player.jpg"
            : uploadedImageUrl || getDefaultListingImage(category);

        const payload = {
          user_id: currentUser.id,
          category,
          type: "sale",
          title:
            formData.get("title")?.toString().trim() ||
            formData.get("title_oro")?.toString().trim() ||
            formData.get("title_donacion")?.toString().trim() ||
            (category === "profession" && professionServices.length ? professionServices[0].name : "") ||
            extraData.title ||
            "",
          description: formData.get("description")?.toString().trim(),
          price:
            Number(formData.get("price") || 0) ||
            Number(formData.get("price_oro") || 0) ||
            Number(formData.get("price_donacion") || 0) ||
            (category === "profession" ? professionTotal || extraData.service_price || 0 : extraData.service_price || 0) ||
            0,
          amount:
            Number(formData.get("amount") || 0) ||
            Number(formData.get("amount_oro") || 0) ||
            Number(formData.get("amount_donacion") || 0) ||
            extraData.amount ||
            0,
          class_name: formData.get("class_name")?.toString().trim(),
          nationality,
          country: formData.get("country")?.toString().trim() || "",
          status: "active",
          image_url: finalImageUrl,
          payment_methods: normalizePaymentMethods(),
          player_roles: buildRoleList(),
          player_professions: category === "profession" ? professionServices : buildProfessions(),
          seller_phone: userProfile?.phone || "",
          seller_whatsapp: userProfile?.phone || "",
          service_name: extraData.service_name || null,
          service_time: extraData.service_time || null,
          service_price: extraData.service_price || null,
          featured_on_home: false,
          created_at: new Date().toISOString()
        };

        if (!payload.title || !payload.description || !payload.price) {
          alert("Completa los campos obligatorios antes de publicar.");
          return;
        }

        if (category === "player" && (!payload.class_name || payload.class_name.toLowerCase() === "general")) {
          alert("La clase del personaje es obligatoria si la oferta es de tipo Player.");
          return;
        }

        if (category === "profession") {
          if (!professionServices.length) {
            alert("Debes añadir al menos una profesión con su precio.");
            return;
          }

          if (!extraData.service_time) {
            alert("En profesiones debes completar el tiempo estimado.");
            return;
          }
        }

        if ((category === "leveling" || category === "profession") && (!extraData.service_name || !extraData.service_time)) {
          alert("En leveling y profesiones debes completar nombre y tiempo estimado.");
          return;
        }

        const { error } = await supabaseClient
          .from("listings")
          .insert([payload]);

        if (error) {
          console.error("Error insertando oferta:", error);
          alert("No se pudo publicar la oferta.");
          return;
        }

        alert("Oferta publicada correctamente.");
        publishForm.reset();
        setCategory("player");
        window.location.href = "index.html";
      } catch (err) {
        console.error("Error publicando:", err);
        alert("No se pudo publicar la oferta.");
      } finally {
        hideGlobalLoader();
        setButtonLoading(submitBtn, false);
      }
    });
  }

  setCategory("player");
});