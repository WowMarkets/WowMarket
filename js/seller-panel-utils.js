async function fetchUserProfile(userId) {
  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

async function fetchSellerListings(userId) {
  const { data, error } = await supabaseClient
    .from("listings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

async function fetchCreditHistory(userId) {
  const { data, error } = await supabaseClient
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .in("type", ["credits", "indemnization", "welcome_trial", "membership"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

function renderCreditHistory(historial, targetId = "profileHistoryList") {
  const container = document.getElementById(targetId);
  if (!container) return;

  if (!historial.length) {
    container.innerHTML = `
      <div class="credit-history-empty">
        Aún no tienes movimientos de créditos.
      </div>
    `;
    return;
  }

  container.innerHTML = historial
    .map((item) => {
      const fecha = item.created_at
        ? new Date(item.created_at).toLocaleString("es-CU", {
            dateStyle: "short",
            timeStyle: "short"
          })
        : "-";

      const cantidad = Number(item.credit_amount || 0);
      const monto = Number(item.amount || 0);
      const positive = cantidad > 0;
      const status = item.status || "pending";
      const isIndemnization = item.type === "indemnization";

      const labels = {
        pending: "Pendiente",
        approved: "Aprobado",
        rejected: "Rechazado",
        completed: "Completado"
      };

      const textStatus = labels[status] || status;

      let labelText = "Movimiento";
      if (item.type === "welcome_trial") {
        labelText = "Cupón de bienvenida • 3 días gratis";
      } else if (item.type === "membership") {
        labelText = "Membresía mensual";
      } else if (isIndemnization) {
        labelText = "Indemnización por estafa";
      } else if (positive) {
        labelText = "Compra de créditos";
      } else {
        labelText = "Gasto de créditos";
      }

      return `
        <div class="credit-history-item">
          <div class="credit-history-main">
            <strong>${labelText}</strong>
            <span>${fecha}</span>
          </div>

          <div class="credit-history-meta">
            <div class="credit-history-status ${status}">
              ${textStatus}
            </div>

            <div class="credit-history-amount ${positive ? "positive" : "negative"}">
              ${positive ? "+" : "-"}${Math.abs(cantidad)} créditos
            </div>

            <div class="credit-history-monto">
              ${monto} ${item.currency || "CREDITS"}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}