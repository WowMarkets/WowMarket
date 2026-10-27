document.addEventListener("DOMContentLoaded", async () => {
  console.log("report.js cargado");

  const currentUser = getCurrentUser();

  if (!currentUser) {
    console.log("No hay usuario logueado");
    window.location.href = "login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const sellerId = params.get("seller_id") || params.get("sellerId");
  const listingId = params.get("listing_id") || params.get("listingId");
  const sellerName = params.get("seller_name") || params.get("sellerName") || "";
  const listingTitle = params.get("listing_title") || params.get("listingTitle") || "";

  console.log("URL params:", { sellerId, listingId, sellerName, listingTitle });

  if (!sellerId) {
    alert("Falta el vendedor.");
    window.location.href = "buscar.html";
    return;
  }

  const sellerInput = document.getElementById("sellerName");
  const listingInput = document.getElementById("listingTitle");
  const sellerHiddenInput = document.getElementById("sellerId");
  const listingHiddenInput = document.getElementById("listingId");
  const buyerEmailInput = document.getElementById("buyerEmail");

  if (sellerHiddenInput) sellerHiddenInput.value = sellerId;
  if (listingHiddenInput) listingHiddenInput.value = listingId || "";

  if (sellerInput && sellerName) sellerInput.value = decodeURIComponent(sellerName);
  if (listingInput && listingTitle) listingInput.value = decodeURIComponent(listingTitle);

  if (buyerEmailInput && currentUser.email) {
    buyerEmailInput.value = currentUser.email;
  }

  const form = document.getElementById("reportForm");
  if (!form) {
    console.error("No existe #reportForm en la página");
    return;
  }

  console.log("Form encontrado:", form);

  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showGlobalLoader("Enviando denuncia...");
    setButtonLoading(submitBtn, true, "Enviando...");

    try {
      console.log("Submit del formulario ejecutado");

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      const buyerEmail = String(payload.buyer_email || "").trim().toLowerCase();

      if (!buyerEmail) {
        alert("Debes poner el correo con el que te registraste.");
        return;
      }

      const { data: userMatch, error: userMatchError } = await supabaseClient
        .from("users")
        .select("id, email, credits")
        .eq("email", buyerEmail)
        .maybeSingle();

      if (userMatchError) {
        console.error(userMatchError);
        alert("No se pudo validar tu correo.");
        return;
      }

      if (!userMatch) {
        alert("Ese correo no existe en la plataforma. Debes usar el correo con el que te registraste.");
        return;
      }

      if (currentUser && userMatch.id !== currentUser.id) {
        alert("Ese correo no coincide con la cuenta que tienes iniciada.");
        return;
      }

      const files = [
        formData.get("photo1"),
        formData.get("photo2"),
        formData.get("photo3")
      ];

      const uploadedUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!(file instanceof File) || file.size === 0) {
          alert("Debes subir 3 fotos de evidencia.");
          return;
        }

        const fileName = `scam-reports/${Date.now()}-${i}-${file.name.replace(/\s+/g, "-")}`;

        try {
          const { error: uploadError } = await supabaseClient.storage
            .from("scam-reports")
            .upload(fileName, file, { upsert: true });

          if (uploadError) {
            console.error("Error de upload:", uploadError);
            alert("No se pudo subir una de las fotos.");
            return;
          }

          const { data: urlData } = supabaseClient.storage
            .from("scam-reports")
            .getPublicUrl(fileName);

          uploadedUrls.push(urlData.publicUrl);
        } catch (err) {
          console.error("Excepción en upload:", err);
          alert("Error al subir una de las fotos.");
          return;
        }
      }

      const { error } = await supabaseClient
        .from("scam_reports")
        .insert([
          {
            seller_id: sellerId,
            listing_id: listingId || null,
            buyer_id: currentUser.id,
            buyer_email: buyerEmail,
            seller_name: payload.seller_name,
            listing_title: payload.listing_title,
            reason: payload.reason,
            description: payload.description,
            evidence_urls: uploadedUrls,
            status: "pending",
            indemnified: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error("Error al guardar el reporte:", error);
        alert("No se pudo enviar el reporte.");
        return;
      }

      const reportTelegramText = `
<b>🚨 Nuevo reporte de estafa</b>

Vendedor: ${payload.seller_name || "No indicado"}
Oferta: ${payload.listing_title || "Sin título"}
Comprador: ${buyerEmail}
Motivo: ${payload.reason || "Sin motivo"}
Descripción: ${payload.description || "Sin descripción"}
Fecha: ${new Date().toISOString()}
`.trim();

      await sendTelegramMessage(
        TELEGRAM_ADMIN_BOT_TOKEN,
        TELEGRAM_ADMIN_CHAT_ID,
        reportTelegramText
      );

      alert("Tu denuncia fue enviada y será revisada por el administrador.");
      window.location.href = "buscar.html";
    } catch (err) {
      console.error("Error general al enviar reporte:", err);
      alert("Hubo un error al enviar el reporte.");
    } finally {
      hideGlobalLoader();
      setButtonLoading(submitBtn, false);
    }
  });
});