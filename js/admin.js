document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const { data: userProfile, error: userProfileError } = await supabaseClient
    .from("users")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (userProfileError || !userProfile || !userProfile.is_admin) {
    console.error(userProfileError);
    window.location.href = "login.html";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearUserSession();
      window.location.href = "index.html";
    });
  }

  const paymentsList = document.getElementById("paymentsList");
  const goldPaymentsList = document.getElementById("goldPaymentsList");
  const scamReportsList = document.getElementById("scamReportsList");
  const scamReportsHistoryList = document.getElementById("scamReportsHistoryList");
  const userStatsContainer = document.getElementById("userStats");

  function getStoragePathFromPublicUrl(publicUrl) {
    if (!publicUrl) return null;

    try {
      const url = new URL(publicUrl);
      const bucketAndPath = url.pathname.split("/storage/v1/object/public/")[1];

      if (!bucketAndPath) return null;

      const parts = bucketAndPath.split("/");
      const bucket = parts.shift();
      const path = parts.join("/");

      if (bucket !== "scam-reports") {
        return null;
      }

      return decodeURIComponent(path);
    } catch {
      return null;
    }
  }

  async function deleteReportAndEvidence(reportId) {
    console.log("deleteReportAndEvidence => reportId:", reportId);

    if (!reportId) {
      console.error("reportId vacío");
      alert("No se pudo identificar el reporte.");
      return;
    }

    const { data: report, error: fetchError } = await supabaseClient
      .from("scam_reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error buscando reporte:", fetchError);
      alert("No se pudo cargar el reporte para borrarlo.");
      return;
    }

    if (!report) {
      console.warn("El reporte ya no existe.");
      await loadAdminData();
      return;
    }

    const evidenceUrls = Array.isArray(report.evidence_urls) ? report.evidence_urls : [];
    const storagePaths = evidenceUrls
      .map(getStoragePathFromPublicUrl)
      .filter(Boolean);

    if (storagePaths.length) {
      const { error: storageDeleteError } = await supabaseClient
        .storage
        .from("scam-reports")
        .remove(storagePaths);

      console.log("storage.remove result:", { storageDeleteError });
    }

    const { error: deleteError } = await supabaseClient
      .from("scam_reports")
      .delete()
      .eq("id", reportId);

    if (deleteError) {
      console.error("Error eliminando reporte:", deleteError);
      alert("No se pudo eliminar el reporte. Revisa la consola y las políticas de la BD.");
      return;
    }

    alert("Reporte eliminado correctamente.");
    await loadAdminData();
  }

  async function loadUserStats() {
    if (!userStatsContainer) return;

    try {
      const { count: totalUsers, error: totalError } = await supabaseClient
        .from("users")
        .select("id", { count: "exact", head: true });

      if (totalError) {
        console.error("Error total usuarios:", totalError);
        userStatsContainer.innerHTML = "<p>No se pudo cargar el conteo.</p>";
        return;
      }

      const hasCreatedAt = await supabaseClient
        .from("users")
        .select("created_at")
        .limit(1);

      const hasCreatedAtColumn = !hasCreatedAt.error;

      let recentUsers = 0;

      if (hasCreatedAtColumn && hasCreatedAt.data && hasCreatedAt.data.length > 0) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { count: recentCount, error: recentError } = await supabaseClient
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo);

        if (!recentError) {
          recentUsers = recentCount ?? 0;
        }
      }

      userStatsContainer.innerHTML = `
        <div class="payment-item">
          <p><strong>Total de usuarios registrados:</strong> ${totalUsers ?? 0}</p>
          <p><strong>Registrados en los últimos 7 días:</strong> ${recentUsers}</p>
        </div>
      `;
    } catch (err) {
      console.error(err);
      if (userStatsContainer) {
        userStatsContainer.innerHTML = "<p>No se pudo cargar el conteo.</p>";
      }
    }
  }

  const loadAdminData = async () => {
    const { data: pendingPayments, error: pendingPaymentsError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .neq("payment_method", "oro")
      .neq("payment_method", "usdt")
      .eq("type", "credits")
      .order("created_at", { ascending: false });

    const { data: goldPayments, error: goldPaymentsError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .in("payment_method", ["oro", "usdt"])
      .eq("type", "credits")
      .order("created_at", { ascending: false });

    const { data: scamReports, error: scamReportsError } = await supabaseClient
      .from("scam_reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const { data: scamReportsHistory, error: scamReportsHistoryError } = await supabaseClient
      .from("scam_reports")
      .select("*")
      .in("status", ["confirmed", "rejected"])
      .order("created_at", { ascending: false });

    const { data: users, error: usersError } = await supabaseClient
      .from("users")
      .select("id, full_name, username, email, country, phone, credits");

    if (pendingPaymentsError) console.error(pendingPaymentsError);
    if (goldPaymentsError) console.error(goldPaymentsError);
    if (scamReportsError) console.error(scamReportsError);
    if (scamReportsHistoryError) console.error(scamReportsHistoryError);
    if (usersError) console.error(usersError);

    const userMap = new Map();
    (users || []).forEach((userRecord) => {
      userMap.set(userRecord.id, userRecord);
    });

    const renderRegularPayments = () => {
      if (!paymentsList) return;

      if (!pendingPayments || pendingPayments.length === 0) {
        paymentsList.innerHTML = "<p>No hay pagos pendientes de transferencia o saldo.</p>";
        return;
      }

      paymentsList.innerHTML = pendingPayments
        .map((payment) => {
          const buyer = userMap.get(payment.user_id) || null;
          const buyerLabel = buyer
            ? `${buyer.full_name || buyer.username || "Usuario"}${buyer.username ? ` (@${buyer.username})` : ""}`
            : payment.user_id;

          return `
            <div class="payment-item">
              <p><strong>Usuario:</strong> ${buyerLabel}</p>
              <p><strong>País:</strong> ${buyer?.country || "No indicado"}</p>
              <p><strong>Créditos solicitados:</strong> ${payment.credit_amount || 0}</p>
              <p><strong>Monto:</strong> ${payment.amount || 0} ${payment.currency || "PESOS"}</p>
              <p><strong>Método:</strong> ${payment.payment_method || "No indicado"}</p>
              <p><strong>Fecha:</strong> ${payment.payment_date || "No indicada"}</p>
              <p><strong>Hora:</strong> ${payment.payment_time || "No indicada"}</p>
              <p><strong>Desde:</strong> ${payment.transfer_from_phone || "No indicado"}</p>
              <p><strong>Últimos 4:</strong> ${payment.last4 || "No indicado"}</p>
              <p><strong>Referencia:</strong> ${payment.reference || "No indicada"}</p>
              <p><strong>Nombre:</strong> ${payment.payment_notes || "No indicado"}</p>

              <div class="payment-actions">
                <button
                  class="btn primary"
                  data-payment-id="${payment.id}"
                  data-user-id="${payment.user_id}"
                  data-credit-amount="${payment.credit_amount || 0}"
                  type="button"
                >
                  Aprobar crédito
                </button>

                <button
                  class="btn secondary"
                  data-reject-payment-id="${payment.id}"
                  type="button"
                >
                  Rechazar
                </button>
              </div>
            </div>
          `;
        })
        .join("");
    };

    const renderGoldPayments = () => {
      if (!goldPaymentsList) return;

      if (!goldPayments || goldPayments.length === 0) {
        goldPaymentsList.innerHTML = "<p>No hay pagos pendientes por oro o USDT.</p>";
        return;
      }

      goldPaymentsList.innerHTML = goldPayments
        .map((payment) => {
          const buyer = userMap.get(payment.user_id) || null;
          const buyerLabel = buyer
            ? `${buyer.full_name || buyer.username || "Usuario"}${buyer.username ? ` (@${buyer.username})` : ""}`
            : payment.user_id;

          return `
            <div class="payment-item">
              <p><strong>Usuario:</strong> ${buyerLabel}</p>
              <p><strong>País:</strong> ${buyer?.country || "No indicado"}</p>
              <p><strong>Método:</strong> ${payment.payment_method || "No indicado"}</p>
              <p><strong>Jugador:</strong> ${payment.gold_target_name || "Venec"}</p>
              <p><strong>Oro a mandar:</strong> ${payment.gold_amount || 0}</p>
              <p><strong>Wallet USDT:</strong> ${payment.usdt_wallet || "No indicado"}</p>
              <p><strong>Hash:</strong> ${payment.tx_hash || "No indicado"}</p>
              <p><strong>Créditos solicitados:</strong> ${payment.credit_amount || 0}</p>
              <p><strong>Monto:</strong> ${payment.amount || 0} ${payment.currency || "PESOS"}</p>
              <p><strong>Nota:</strong> ${payment.proof_note || "Sin nota"}</p>

              ${payment.proof_image_url ? `
                <div class="proof-image-box">
                  <img src="${payment.proof_image_url}" alt="Comprobante de pago" />
                </div>
              ` : `
                <p><strong>Sin comprobante:</strong> aún no se subió la imagen.</p>
              `}

              <div class="payment-actions">
                <button
                  class="btn primary"
                  data-gold-payment-id="${payment.id}"
                  data-user-id="${payment.user_id}"
                  data-credit-amount="${payment.credit_amount || 0}"
                  type="button"
                >
                  Aprobar pago
                </button>

                <button
                  class="btn secondary"
                  data-reject-gold-payment-id="${payment.id}"
                  type="button"
                >
                  Rechazar
                </button>
              </div>
            </div>
          `;
        })
        .join("");
    };

    const renderScamReports = () => {
      if (!scamReportsList) return;

      if (!scamReports || scamReports.length === 0) {
        scamReportsList.innerHTML = "<p>No hay reportes pendientes.</p>";
        return;
      }

      scamReportsList.innerHTML = scamReports
        .map((report) => `
          <div class="payment-item report-item">
            <button
              class="report-dismiss-btn"
              data-dismiss-scam="${report.id}"
              type="button"
              aria-label="Eliminar reporte"
              title="Eliminar reporte y fotos"
            >
              ×
            </button>

            <p><strong>Vendedor:</strong> ${report.seller_name || report.seller_id}</p>
            <p><strong>Oferta:</strong> ${report.listing_title || "Sin título"}</p>
            <p><strong>Comprador:</strong> ${report.buyer_email || "No indicado"}</p>
            <p><strong>Motivo:</strong> ${report.reason || "No indicado"}</p>
            <p><strong>Descripción:</strong> ${report.description || "Sin detalle"}</p>
            <p><strong>Estado:</strong> ${report.status || "pending"}</p>

            ${report.evidence_urls && report.evidence_urls.length
              ? `
                <div class="proof-image-box">
                  ${report.evidence_urls
                    .map((url) => `<img src="${url}" alt="Evidencia de estafa" />`)
                    .join("")}
                </div>
              `
              : ""}

            <div class="payment-actions">
              <button
                class="btn primary"
                data-confirm-scam="${report.id}"
                type="button"
              >
                Confirmar estafa
              </button>

              <button
                class="btn secondary"
                data-reject-scam="${report.id}"
                type="button"
              >
                Rechazar
              </button>
            </div>
          </div>
        `)
        .join("");
    };

    const renderScamReportsHistory = () => {
      if (!scamReportsHistoryList) return;

      if (!scamReportsHistory || scamReportsHistory.length === 0) {
        scamReportsHistoryList.innerHTML = "<p>No hay historial de reportes resueltos.</p>";
        return;
      }

      scamReportsHistoryList.innerHTML = scamReportsHistory
        .map((report) => `
          <div class="payment-item">
            <p><strong>Vendedor:</strong> ${report.seller_name || report.seller_id}</p>
            <p><strong>Oferta:</strong> ${report.listing_title || "Sin título"}</p>
            <p><strong>Comprador:</strong> ${report.buyer_email || "No indicado"}</p>
            <p><strong>Motivo:</strong> ${report.reason || "No indicado"}</p>
            <p><strong>Estado final:</strong> ${report.status || "sin estado"}</p>
            <p><strong>Indemnizado:</strong> ${report.indemnified ? "Sí" : "No"}</p>
            <p><strong>Fecha:</strong> ${report.created_at || "-"}</p>
          </div>
        `)
        .join("");
    };

    const creditUser = async (userId, creditAmount) => {
      const { data: targetUser, error: targetUserError } = await supabaseClient
        .from("users")
        .select("credits")
        .eq("id", userId)
        .maybeSingle();

      if (targetUserError) {
        console.error(targetUserError);
        throw new Error("No se pudo cargar el usuario.");
      }

      if (!targetUser) {
        throw new Error("No existe el perfil del usuario.");
      }

      const nuevoSaldo = Number(targetUser.credits || 0) + Number(creditAmount || 0);

      const { error: userUpdateError } = await supabaseClient
        .from("users")
        .update({
          credits: nuevoSaldo
        })
        .eq("id", userId);

      if (userUpdateError) {
        console.error(userUpdateError);
        throw new Error("No se pudieron acreditar los créditos.");
      }

      return nuevoSaldo;
    };

    const rejectPayment = async (paymentId, reason = "Rechazado por el administrador") => {
      const { error } = await supabaseClient
        .from("payments")
        .update({
          status: "rejected",
          rejected_at: new Date().toISOString(),
          rejected_by: currentUser.id,
          rejection_reason: reason
        })
        .eq("id", paymentId);

      if (error) {
        console.error(error);
        throw new Error("No se pudo rechazar el pago.");
      }
    };

    const addToPublicScammerList = async (sellerId, reason) => {
      const { data: sellerProfile, error: sellerProfileError } = await supabaseClient
        .from("users")
        .select("full_name, username, phone")
        .eq("id", sellerId)
        .maybeSingle();

      if (sellerProfileError) {
        console.error(sellerProfileError);
        return;
      }

      if (!sellerProfile) {
        console.warn("No existe el vendedor para agregar a la lista pública.");
        return;
      }

      const { data: existingScammer, error: existingScammerError } = await supabaseClient
        .from("public_scammer_list")
        .select("id")
        .eq("user_id", sellerId)
        .maybeSingle();

      if (existingScammerError) {
        console.error(existingScammerError);
      }

      if (existingScammer) {
        return;
      }

      const { error: insertError } = await supabaseClient
        .from("public_scammer_list")
        .insert([
          {
            user_id: sellerId,
            full_name: sellerProfile.full_name || "",
            username: sellerProfile.username || "",
            phone: sellerProfile.phone || "",
            reason: reason || "Fraud confirmed by admin",
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error(insertError);
        alert("Se confirmó la estafa, pero no se pudo agregar a la lista pública.");
      }
    };

    renderRegularPayments();
    renderGoldPayments();
    renderScamReports();
    renderScamReportsHistory();

    document.querySelectorAll("[data-payment-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.dataset.paymentId;
        const userId = button.dataset.userId;
        const creditAmount = Number(button.dataset.creditAmount || 0);

        try {
          await creditUser(userId, creditAmount);

          const { error: paymentUpdateError } = await supabaseClient
            .from("payments")
            .update({
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: currentUser.id
            })
            .eq("id", paymentId);

          if (paymentUpdateError) {
            throw new Error("No se pudo aprobar el pago.");
          }

          const { data: buyerProfile, error: buyerProfileError } = await supabaseClient
            .from("users")
            .select("id, email, full_name, username, telegram_chat_id, phone")
            .eq("id", userId)
            .maybeSingle();

          if (!buyerProfileError && buyerProfile && buyerProfile.telegram_chat_id) {
            const buyerMessage = `
<b>✅ Pago aprobado</b>

Hola ${buyerProfile.full_name || buyerProfile.username || "comprador"}.

Tu comprobante fue revisado y aprobado.
Créditos acreditados: ${creditAmount}
Monto verificado: ${Number(creditAmount || 0)} créditos

Gracias por usar WoW Market.
`.trim();

            await sendTelegramMessage(
              TELEGRAM_BUYER_BOT_TOKEN,
              buyerProfile.telegram_chat_id,
              buyerMessage
            );
          }

          alert("Créditos acreditados correctamente.");
          await loadAdminData();
          await loadUserStats();
        } catch (err) {
          console.error(err);
          alert(err.message || "No se pudo aprobar el pago.");
        }
      });
    });

    document.querySelectorAll("[data-gold-payment-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.dataset.goldPaymentId;
        const userId = button.dataset.userId;
        const creditAmount = Number(button.dataset.creditAmount || 0);

        try {
          await creditUser(userId, creditAmount);

          const { error: goldUpdateError } = await supabaseClient
            .from("payments")
            .update({
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: currentUser.id
            })
            .eq("id", paymentId);

          if (goldUpdateError) {
            throw new Error("No se pudo aprobar el pago.");
          }

          const { data: buyerProfile, error: buyerProfileError } = await supabaseClient
            .from("users")
            .select("id, email, full_name, username, telegram_chat_id, phone")
            .eq("id", userId)
            .maybeSingle();

          if (!buyerProfileError && buyerProfile && buyerProfile.telegram_chat_id) {
            const buyerMessage = `
<b>✅ Pago aprobado</b>

Hola ${buyerProfile.full_name || buyerProfile.username || "comprador"}.

Tu comprobante fue revisado y aprobado.
Créditos acreditados: ${creditAmount}
Monto verificado: ${Number(creditAmount || 0)} créditos

Gracias por usar WoW Market.
`.trim();

            await sendTelegramMessage(
              TELEGRAM_BUYER_BOT_TOKEN,
              buyerProfile.telegram_chat_id,
              buyerMessage
            );
          }

          alert("Pago aprobado correctamente.");
          await loadAdminData();
          await loadUserStats();
        } catch (err) {
          console.error(err);
          alert(err.message || "No se pudo aprobar el pago.");
        }
      });
    });

    document.querySelectorAll("[data-reject-payment-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.dataset.rejectPaymentId;

        try {
          await rejectPayment(paymentId);
          alert("Pago rechazado.");
          await loadAdminData();
        } catch (err) {
          console.error(err);
          alert(err.message || "No se pudo rechazar el pago.");
        }
      });
    });

    document.querySelectorAll("[data-reject-gold-payment-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const paymentId = button.dataset.rejectGoldPaymentId;

        try {
          await rejectPayment(paymentId);
          alert("Pago rechazado.");
          await loadAdminData();
        } catch (err) {
          console.error(err);
          alert(err.message || "No se pudo rechazar el pago.");
        }
      });
    });

    document.querySelectorAll("[data-dismiss-scam]").forEach((button) => {
      button.addEventListener("click", async () => {
        const reportId = button.dataset.dismissScam;

        if (!reportId) {
          alert("No se pudo identificar el reporte.");
          return;
        }

        const ok = confirm("¿Seguro que quieres eliminar este reporte y sus fotos de evidencia?");
        if (!ok) return;

        await deleteReportAndEvidence(reportId);
      });
    });

    document.querySelectorAll("[data-confirm-scam]").forEach((button) => {
      button.addEventListener("click", async () => {
        const reportId = button.dataset.confirmScam;

        const { data: report, error: reportError } = await supabaseClient
          .from("scam_reports")
          .select("*")
          .eq("id", reportId)
          .maybeSingle();

        if (reportError || !report) {
          alert("No se pudo cargar el reporte.");
          return;
        }

        if (report.indemnified) {
          alert("Este reporte ya fue indemnizado.");
          return;
        }

        const { data: buyerUser, error: buyerUserError } = await supabaseClient
          .from("users")
          .select("id, email, credits")
          .eq("email", report.buyer_email)
          .maybeSingle();

        if (buyerUserError) {
          console.error(buyerUserError);
          alert("No se pudo encontrar al comprador con ese correo.");
          return;
        }

        if (!buyerUser) {
          alert("No existe la cuenta del comprador con ese correo.");
          return;
        }

        const indemnizationAmount = 1000;
        const reason = report.reason || report.description || "Fraud confirmed by admin";

        try {
          const { error: indemnizationInsertError } = await supabaseClient
            .from("payments")
            .insert([
              {
                user_id: buyerUser.id,
                type: "credits",
                amount: indemnizationAmount,
                currency: "CREDITS",
                status: "approved",
                payment_method: "admin",
                reference: `indemnizacion-${reportId}`,
                payment_date: new Date().toISOString().split("T")[0],
                payment_time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
                payment_notes: "Indemnización por estafa confirmada",
                credit_amount: indemnizationAmount,
                created_at: new Date().toISOString()
              }
            ]);

          if (indemnizationInsertError) {
            throw new Error("No se pudo registrar la indemnización.");
          }

          const newCredits = Number(buyerUser.credits || 0) + indemnizationAmount;

          const { error: userCreditsError } = await supabaseClient
            .from("users")
            .update({ credits: newCredits })
            .eq("id", buyerUser.id);

          if (userCreditsError) {
            throw new Error("No se pudieron acreditar los 1000 créditos al comprador.");
          }

          const { error: notificationInsertError } = await supabaseClient
            .from("notifications")
            .insert([
              {
                user_id: buyerUser.id,
                title: "Indemnización recibida",
                message: "Tu denuncia fue confirmada. Se te han acreditado 1000 créditos por indemnización.",
                created_at: new Date().toISOString()
              }
            ]);

          if (notificationInsertError) {
            console.error(notificationInsertError);
          }

          const { error: updateReportError } = await supabaseClient
            .from("scam_reports")
            .update({
              status: "confirmed",
              indemnified: true,
              indemnified_at: new Date().toISOString()
            })
            .eq("id", reportId);

          if (updateReportError) {
            throw new Error("No se pudo cerrar el reporte.");
          }

          await addToPublicScammerList(report.seller_id, reason);

          const { error: userUpdateError } = await supabaseClient
            .from("users")
            .update({
              is_banned: true,
              is_scammer: true,
              scam_reason: reason,
              banned_at: new Date().toISOString()
            })
            .eq("id", report.seller_id);

          if (userUpdateError) {
            throw new Error("No se pudo bloquear al vendedor.");
          }

          await supabaseClient
            .from("listings")
            .delete()
            .eq("user_id", report.seller_id);

          alert("Estafa confirmada. El comprador fue indemnizado con 1000 créditos y el vendedor quedó bloqueado.");
          await loadAdminData();
        } catch (err) {
          console.error(err);
          alert(err.message || "No se pudo confirmar la estafa.");
        }
      });
    });

    document.querySelectorAll("[data-reject-scam]").forEach((button) => {
      button.addEventListener("click", async () => {
        const reportId = button.dataset.rejectScam;

        const { error } = await supabaseClient
          .from("scam_reports")
          .update({
            status: "rejected"
          })
          .eq("id", reportId);

        if (error) {
          console.error(error);
          alert("No se pudo rechazar el reporte.");
          return;
        }

        alert("Reporte rechazado.");
        await loadAdminData();
      });
    });
  };

  await loadUserStats();
  await loadAdminData();
});