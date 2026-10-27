async function renderPromotions(userData) {
  const promotionsContent = document.getElementById("promotionsContent");
  if (!promotionsContent) return;

  const sellerListings = await fetchSellerListings(userData.id);
  const activeSellerListings = sellerListings.filter((item) => item.status === "active");

  const membershipActive = isMembershipActive(userData);

  const isWelcome = userData.membership_status === "welcome";
  const isTrialActive = isWelcomeTrialActive(userData);

  let statusText = "Sin membresía activa";
  let countdownHtml = "<p>Sin activación disponible.</p>";

  if (isWelcome && isTrialActive) {
    statusText = "Prueba gratis activa";
    countdownHtml = `
      <p><strong>Tu prueba gratuita termina en:</strong> ${getMembershipCountdownLabel(userData.membership_expires_at)}</p>
      <p>Durante este periodo puedes publicar y vender normalmente.</p>
    `;
  } else if (isWelcome && !isTrialActive) {
    statusText = "Prueba gratis vencida";
    countdownHtml = `
      <p><strong>Tu prueba gratuita terminó.</strong> Debes pagar la membresía para seguir usando la app.</p>
    `;
  } else if (userData.membership_expires_at) {
    if (membershipActive) {
      statusText = "Membresía activa";
      countdownHtml = `
        <p><strong>Tiempo restante:</strong> ${getMembershipCountdownLabel(userData.membership_expires_at)}</p>
      `;
    } else {
      statusText = "Membresía vencida";
      countdownHtml = `
        <p><strong>La membresía ya venció.</strong> Debes renovarla para volver a publicar ofertas.</p>
      `;
    }
  }

  const needsMembership =
    !userData.membership_status ||
    userData.membership_status !== "active" ||
    !membershipActive;

  promotionsContent.innerHTML = `
    <div>
      <h3>Promociones</h3>

      <div class="payment-list">
        <div class="payment-item">
          <h4>Membresía mensual</h4>
          <p><strong>Estado:</strong> ${statusText}</p>
          ${countdownHtml}
          <p>Precio: 500 créditos</p>
          <p>Incluye: acceso para publicar ofertas durante 30 días</p>

          ${needsMembership ? `
            <button class="btn primary" id="activateMembershipBtn">Pagar con créditos</button>
          ` : ""}
        </div>

        <div class="payment-item">
          <h4>Promoción Premium</h4>
          <p>Precio: 250 créditos</p>
          <p>Duración: 24 horas</p>
          <p>Máximo: 10 publicaciones activas por día</p>
          <p>Tu oferta aparecerá en el carrusel de la home.</p>

          <div class="premium-select-wrap">
            <label for="promotionListingSelect">Selecciona tu oferta</label>
            <select id="promotionListingSelect">
              <option value="">-- Elige una oferta --</option>
              ${activeSellerListings
                .map(
                  (listing) => `
                    <option value="${listing.id}">
                      ${listing.title || "Oferta sin título"} (${listing.category || "general"})
                    </option>
                  `
                )
                .join("")}
            </select>
          </div>

          <button class="btn primary" id="activatePremiumBtn" type="button">
            Pagar 250 créditos
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("activateMembershipBtn")?.addEventListener("click", async () => {
    const costo = 500;
    const saldoActual = Number(userData.credits || 0);

    if (saldoActual < costo) {
      alert(`No tienes suficientes créditos para pagar la membresía. Necesitas ${costo} créditos y tienes ${saldoActual}.`);
      return;
    }

    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + 30);

    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert([
        {
          user_id: userData.id,
          type: "membership",
          amount: 0,
          currency: "CREDITS",
          status: "approved",
          payment_method: "credits",
          reference: `membership-${Date.now()}`,
          payment_date: new Date().toISOString().split("T")[0],
          payment_time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
          payment_notes: "Pago de membresía mensual con créditos",
          credit_amount: -costo,
          created_at: new Date().toISOString()
        }
      ]);

    if (paymentError) {
      console.error(paymentError);
      alert("No se pudo registrar el pago de la membresía.");
      return;
    }

    const { error: userUpdateError } = await supabaseClient
      .from("users")
      .update({
        credits: saldoActual - costo,
        membership_status: "active",
        membership_expires_at: fechaFin.toISOString(),
        is_membership_active: true
      })
      .eq("id", userData.id);

    if (userUpdateError) {
      console.error(userUpdateError);
      alert("Se registró el pago, pero no se pudo descontar los créditos.");
      return;
    }

    userData.credits = saldoActual - costo;
    userData.membership_status = "active";
    userData.membership_expires_at = fechaFin.toISOString();
    userData.is_membership_active = true;

    alert("Membresía activada correctamente por 30 días.");
    renderPromotions(userData);
  });

  document.getElementById("activatePremiumBtn")?.addEventListener("click", async () => {
    const select = document.getElementById("promotionListingSelect");
    const listingId = select?.value;

    if (!listingId) {
      alert("Debes seleccionar una oferta para promocionar.");
      return;
    }

    const costo = 250;
    const saldoActual = Number(userData.credits || 0);

    if (saldoActual < costo) {
      alert(`No tienes suficientes créditos para promocionar. Necesitas ${costo} créditos y tienes ${saldoActual}.`);
      return;
    }

    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", userData.id)
      .maybeSingle();

    if (listingError || !listing) {
      alert("La oferta no existe o no pertenece a tu cuenta.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: activeToday, error: activeError } = await supabaseClient
      .from("premium_promotions")
      .select("*")
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString());

    if (activeError) {
      console.error(activeError);
      alert("No se pudo comprobar las promociones activas.");
      return;
    }

    const activeCount = activeToday ? activeToday.length : 0;
    let status = "active";
    let queuePosition = 0;

    if (activeCount >= 10) {
      status = "queued";

      const { data: queuedToday, error: queuedError } = await supabaseClient
        .from("premium_promotions")
        .select("*")
        .eq("status", "queued")
        .eq("slot_day", today);

      if (queuedError) {
        console.error(queuedError);
        return;
      }

      queuePosition = queuedToday ? queuedToday.length + 1 : 1;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { error: promoInsertError } = await supabaseClient
      .from("premium_promotions")
      .insert([
        {
          user_id: userData.id,
          listing_id: listing.id,
          status,
          slot_day: today,
          queue_position: queuePosition,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (promoInsertError) {
      console.error(promoInsertError);
      alert("No se pudo registrar la promoción.");
      return;
    }

    const { error: userUpdateError } = await supabaseClient
      .from("users")
      .update({ credits: saldoActual - costo })
      .eq("id", userData.id);

    if (userUpdateError) {
      console.error(userUpdateError);
      alert("Se registró la promoción, pero no se pudo descontar los créditos.");
      return;
    }

    userData.credits = saldoActual - costo;

    if (status === "active") {
      alert("Tu oferta quedó activa en la home durante 24 horas.");
    } else {
      alert("La promoción está llena hoy. Tu solicitud quedó en cola.");
    }

    renderPromotions(userData);
  });
}