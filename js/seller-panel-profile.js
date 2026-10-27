async function renderProfile(userData) {
  const profileContent = document.getElementById("profileContent");
  if (!profileContent) return;

  profileContent.innerHTML = `
    <div class="profile-header">
      <img
        class="avatar-small"
        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
        alt="avatar"
      />
      <div>
        <h3>${userData.full_name || "Sin nombre"}</h3>
        <p>⭐ ${userData.rating || 4.9} / 5</p>
        <p>${userData.reviews_count || 0} recomendaciones</p>
      </div>
    </div>

    <p><strong>Usuario:</strong> ${userData.username}</p>
    <p><strong>Email:</strong> ${userData.email}</p>
    <p><strong>País:</strong> ${userData.country || "No especificado"}</p>
    <p><strong>Nacionalidad:</strong> ${userData.nationality || "No especificada"}</p>
    <p><strong>Teléfono:</strong> ${userData.phone || "No especificado"}</p>
    <p><strong>Bio:</strong> ${userData.bio || "Sin bio aún"}</p>

    <div style="margin-top: 18px;">
      <button type="button" class="btn primary" id="editProfileBtn">Editar perfil</button>
    </div>

    <div class="profile-history-box">
      <h3>Historial de créditos</h3>
      <div id="profileHistoryList" class="credit-history-list"></div>
    </div>

    <div class="info-box">
      <h3>Antes de publicar</h3>
      <p>Para comenzar a publicar tus ofertas debes obtener la membresía mensual en el apartado de promociones.</p>
      <p>Si tu cuenta vence, podrás seguir navegando, pero no podrás publicar nuevos anuncios hasta que pagues la membresía nuevamente.</p>
      <p>La membresía activa te permite usar la app para vender, pero si cometes fraude o engañas a algún cliente, la app puede bloquearte y reportarte.</p>
    </div>

    <div class="info-box danger">
      <h3>Reglas importantes</h3>
      <p>Si un cliente te reporta por fraude, tu número de teléfono, nombre y fotos de tus players serán compartidos en grupos de Facebook, WhatsApp y en una lista pública de estafadores dentro de la app.</p>
      <p>Cada usuario que visite la app podrá ver que estás registrado como estafador.</p>
      <p>Esto también puede afectar tu cuenta y tu acceso a la plataforma.</p>
    </div>
  `;

  const historial = await fetchCreditHistory(userData.id);
  renderCreditHistory(historial, "profileHistoryList");

  document.getElementById("editProfileBtn")?.addEventListener("click", () => {
    renderProfileEditor(userData);
  });
}

async function renderProfileEditor(userData) {
  const profileContent = document.getElementById("profileContent");
  if (!profileContent) return;

  profileContent.innerHTML = `
    <div class="form-box">
      <h2>Editar perfil</h2>

      <form id="profileEditForm">
        <input type="text" name="full_name" value="${userData.full_name || ""}" placeholder="Nombre completo" required />
        <input type="text" name="username" value="${userData.username || ""}" placeholder="Nombre de usuario" required />
        <input type="email" name="email" value="${userData.email || ""}" placeholder="Correo electrónico" required />
        <select name="country">
          <option value="">País</option>
          <option value="Cuba" ${userData.country === "Cuba" ? "selected" : ""}>Cuba</option>
          <option value="Argentina" ${userData.country === "Argentina" ? "selected" : ""}>Argentina</option>
          <option value="Estados Unidos" ${userData.country === "Estados Unidos" ? "selected" : ""}>Estados Unidos</option>
          <option value="Perú" ${userData.country === "Perú" ? "selected" : ""}>Perú</option>
        </select>

        <select name="nationality">
          <option value="">Nacionalidad</option>
          <option value="Cuba" ${userData.nationality === "Cuba" ? "selected" : ""}>Cuba</option>
          <option value="Argentina" ${userData.nationality === "Argentina" ? "selected" : ""}>Argentina</option>
          <option value="Estados Unidos" ${userData.nationality === "Estados Unidos" ? "selected" : ""}>Estados Unidos</option>
          <option value="Perú" ${userData.nationality === "Perú" ? "selected" : ""}>Perú</option>
        </select>

        <input type="tel" name="phone" value="${userData.phone || ""}" placeholder="Teléfono de contacto" />
        <textarea name="bio" placeholder="Describe tu perfil de vendedor">${userData.bio || ""}</textarea>

        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button type="submit" class="btn primary">Guardar cambios</button>
          <button type="button" class="btn secondary" id="cancelProfileEditBtn">Cancelar</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("profileEditForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const updatedData = Object.fromEntries(formData.entries());

    const { error } = await supabaseClient
      .from("users")
      .update({
        full_name: updatedData.full_name,
        username: updatedData.username,
        email: updatedData.email,
        country: updatedData.country,
        nationality: updatedData.nationality,
        phone: updatedData.phone,
        bio: updatedData.bio
      })
      .eq("id", userData.id);

    if (error) {
      console.error(error);
      alert("No se pudo guardar el perfil.");
      return;
    }

    Object.assign(userData, {
      full_name: updatedData.full_name,
      username: updatedData.username,
      email: updatedData.email,
      country: updatedData.country,
      nationality: updatedData.nationality,
      phone: updatedData.phone,
      bio: updatedData.bio
    });

    alert("Perfil actualizado correctamente.");
    renderProfile(userData);
  });

  document.getElementById("cancelProfileEditBtn")?.addEventListener("click", () => {
    renderProfile(userData);
  });
}