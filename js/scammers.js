document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("scammerList");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("public_scammer_list")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>No se pudo cargar la lista pública de estafadores.</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="payment-item">
        <p>No hay estafadores registrados en la lista pública.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = data
    .map((scammer) => {
      const fullName = scammer.full_name || "Sin nombre";
      const phone = scammer.phone || "No disponible";
      const reason = scammer.reason || "Sin motivo especificado";

      return `
        <article class="scammer-card">
          <div class="scammer-header">
            <div class="scammer-badge">Estafador</div>
          </div>

          <h3>${fullName}</h3>

          <div class="scammer-meta">
            <p><strong>Teléfono:</strong> ${phone}</p>
            <p><strong>Usuario:</strong> ${scammer.username || "No disponible"}</p>
          </div>

          <div class="scammer-reason">
            <strong>Motivo de la estafa:</strong>
            <p>${reason}</p>
          </div>
        </article>
      `;
    })
    .join("");
});