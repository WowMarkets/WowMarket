async function renderCredits(userData) {
  const creditsContent = document.getElementById("creditsContent");
  if (!creditsContent) return;

  const isCuba = (userData.country || "").trim() === "Cuba";

  const getAvailablePaymentTypes = () => {
    if (isCuba) {
      return ["transferencia", "saldo", "oro"];
    }

    return ["oro", "usdt"];
  };

  let activePaymentType = getAvailablePaymentTypes()[0] || "oro";

  const getPacksByPayment = (paymentType, country) => {
    const countryIsCuba = (country || "").trim() === "Cuba";

    if (paymentType === "saldo") {
      return [
        { credits: 1000, price: 360, currency: "CUP", label: "Más popular" },
        { credits: 600, price: 240, currency: "CUP", label: "Recomendado" },
        { credits: 300, price: 140, currency: "CUP", label: "Básico" }
      ];
    }

    if (paymentType === "oro") {
      if (countryIsCuba) {
        return [
          { credits: 1000, price: 8000, currency: "ORO", gold_amount: 8000, label: "Más popular" },
          { credits: 600, price: 5000, currency: "ORO", gold_amount: 5000, label: "Recomendado" },
          { credits: 300, price: 2000, currency: "ORO", gold_amount: 3000, label: "Básico" }
        ];
      }

      return [
        { credits: 1000, price: 10000, currency: "ORO", gold_amount: 10000, label: "Más popular" },
        { credits: 600, price: 6000, currency: "ORO", gold_amount: 6000, label: "Recomendado" },
        { credits: 400, price: 4000, currency: "ORO", gold_amount: 3000, label: "Básico" }
      ];
    }

    if (paymentType === "usdt") {
      return [
        { credits: 1000, price: 3, currency: "USDT", label: "Más popular" },
        { credits: 600, price: 2, currency: "USDT", label: "Recomendado" },
        { credits: 300, price: 1, currency: "USDT", label: "Básico" }
      ];
    }

    return [
      { credits: 1000, price: 800, currency: "CUP", label: "Más popular" },
      { credits: 600, price: 500, currency: "CUP", label: "Recomendado" },
      { credits: 400, price: 200, currency: "CUP", label: "Básico" }
    ];
  };

  const renderPaymentForm = (paymentType, selectedCredits = 0, selectedPrice = null) => {
    const paymentFormContainer = document.getElementById("paymentFormContainer");
    if (!paymentFormContainer) return;

    let formHtml = "";

    if (paymentType === "transferencia") {
      formHtml = `
        <form class="payment-form">
          <div>
            <label>Pack elegido</label>
            <p><strong>${selectedCredits || 0} créditos</strong> · ${selectedPrice ? `${selectedPrice.price} ${selectedPrice.currency}` : ""}</p>
          </div>

          <div class="payment-note">
            <p><strong>Mi tarjeta:</strong> 9227-9598-7452-0377</p>
            <p><strong>Confirmación:</strong> 63027273</p>
          </div>

          <div>
            <label>Fecha de la transferencia</label>
            <input type="date" name="payment_date" required />
          </div>

          <div>
            <label>Hora</label>
            <input type="time" name="payment_time" required />
          </div>

          <div>
            <label>Últimos 4 dígitos</label>
            <input type="text" name="last4" maxlength="4" placeholder="Ej: 3333" required />
          </div>

          <div>
            <label>Número desde el que transferiste</label>
            <input type="tel" name="transfer_phone" placeholder="Ej: +53 5..." required />
          </div>

          <div>
            <label>Nombre completo</label>
            <input type="text" name="name" placeholder="Nombre completo" required />
          </div>

          <div>
            <label>Referencia</label>
            <input type="text" name="reference" placeholder="Referencia" />
          </div>

          <button type="submit" class="btn primary">Enviar comprobante</button>
        </form>
      `;
    }

    if (paymentType === "saldo") {
      formHtml = `
        <form class="payment-form">
          <div>
            <label>Pack elegido</label>
            <p><strong>${selectedCredits || 0} créditos</strong> · ${selectedPrice ? `${selectedPrice.price} ${selectedPrice.currency}` : ""}</p>
          </div>

          <div class="payment-note">
            <p><strong>Transferir saldo a mi número:</strong> 63027273</p>
          </div>

          <div>
            <label>Fecha</label>
            <input type="date" name="payment_date" required />
          </div>

          <div>
            <label>Hora</label>
            <input type="time" name="payment_time" required />
          </div>

          <div>
            <label>Número desde el que transferiste</label>
            <input type="tel" name="transfer_phone" placeholder="Ej: +53 5..." required />
          </div>

          <div>
            <label>Referencia</label>
            <input type="text" name="reference" placeholder="Referencia" />
          </div>

          <button type="submit" class="btn primary">Enviar comprobante</button>
        </form>
      `;
    }

    if (paymentType === "oro") {
      formHtml = `
        <form class="payment-form">
          <div>
            <label>Pack elegido</label>
            <p><strong>${selectedCredits || 0} créditos</strong> · ${selectedPrice ? `${selectedPrice.price} ${selectedPrice.currency}` : ""}</p>
          </div>

          <div class="payment-note">
            <p><strong>Jugador al que debes mandar el oro:</strong> wowmarket</p>
            <p><strong>Cantidad a mandar:</strong> ${Number(selectedPrice?.gold_amount || 0).toLocaleString("es-ES")} oro</p>
            <p><strong>Importante:</strong> luego sube una foto del comprobante.</p>
          </div>

          <div>
            <label>Nombre del jugador con el que transferiste</label>
            <input type="text" name="gold_target_name" value="" required />
          </div>

          <div>
            <label>Cantidad a mandar</label>
            <input type="text" value="${Number(selectedPrice?.gold_amount || 0).toLocaleString("es-ES")}" readonly />
          </div>

          <div>
            <label>Foto del comprobante</label>
            <input type="file" name="proof_image" accept="image/*" required />
          </div>

          <div>
            <label>Nota opcional</label>
            <input type="text" name="proof_note" placeholder="Ej: envío realizado" />
          </div>

          <button type="submit" class="btn primary">Enviar pago por oro</button>
        </form>
      `;
    }

    if (paymentType === "usdt") {
      formHtml = `
        <form class="payment-form">
          <div>
            <label>Pack elegido</label>
            <p><strong>${selectedCredits || 0} créditos</strong> · ${selectedPrice ? `${selectedPrice.price} ${selectedPrice.currency}` : ""}</p>
          </div>

          <div class="payment-note">
            <p><strong>Wallet USDT:</strong> TQ7u...x9K2</p>
            <p><strong>Red:</strong> TRC20</p>
            <p><strong>Importante:</strong> sube una foto del comprobante.</p>
          </div>

          <div>
            <label>Wallet de destino</label>
            <input type="text" name="usdt_wallet" value="TQ7u...x9K2" readonly />
          </div>

          <div>
            <label>Monto a enviar</label>
            <input type="text" value="${selectedPrice ? `${selectedPrice.price} ${selectedPrice.currency}` : ""}" readonly />
          </div>

          <div>
            <label>Hash de la transacción</label>
            <input type="text" name="tx_hash" placeholder="Ej: 0xabc..." required />
          </div>

          <div>
            <label>Foto del comprobante</label>
            <input type="file" name="proof_image" accept="image/*" required />
          </div>

          <div>
            <label>Nota opcional</label>
            <input type="text" name="proof_note" placeholder="Ej: enviado" />
          </div>

          <button type="submit" class="btn primary">Enviar pago por USDT</button>
        </form>
      `;
    }

    paymentFormContainer.innerHTML = formHtml;

    const form = paymentFormContainer.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitBtn = form.querySelector("button[type='submit']");
      showGlobalLoader("Enviando comprobante...");
      setButtonLoading(submitBtn, true, "Enviando...");

      try {
        const formData = new FormData(form);

        let proofImageUrl = null;

        if (paymentType === "oro" || paymentType === "usdt") {
          const file = formData.get("proof_image");
          if (!file || !(file instanceof File) || file.size === 0) {
            alert("Debes subir una foto de comprobante.");
            return;
          }

          const fileExt = file.name.split(".").pop();
          const fileName = `payments/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabaseClient.storage
            .from("payments")
            .upload(fileName, file, { upsert: true });

          if (uploadError) {
            console.error(uploadError);
            alert("No se pudo subir la imagen del comprobante.");
            return;
          }

          const { data: urlData } = supabaseClient.storage
            .from("payments")
            .getPublicUrl(fileName);

          proofImageUrl = urlData?.publicUrl || null;
        }

        const payload = {
          user_id: userData.id,
          type: "credits",
          amount: Number(selectedPrice?.price || 0),
          currency: paymentType === "oro" ? "ORO" : paymentType === "usdt" ? "USDT" : "PESOS",
          status: "pending",
          payment_method: paymentType,
          reference: paymentType === "oro" ? "pago-por-oro" : paymentType === "usdt" ? "pago-usdt" : formData.get("reference") || "",
          payment_date: formData.get("payment_date") || new Date().toISOString().split("T")[0],
          payment_time: formData.get("payment_time") || new Date().toLocaleTimeString("es-ES", { hour12: false }),
          transfer_from_phone: formData.get("transfer_phone") || "",
          last4: formData.get("last4") || "",
          payment_notes: formData.get("name") || formData.get("proof_note") || "",
          credit_amount: Number(selectedCredits || 0),
          created_at: new Date().toISOString(),
          gold_target_name: paymentType === "oro" ? (formData.get("gold_target_name") || "wowmarket").toString().trim() : null,
          gold_amount: paymentType === "oro" ? Number(selectedPrice?.gold_amount || 0) : null,
          usdt_wallet: paymentType === "usdt" ? (formData.get("usdt_wallet") || "").toString().trim() : null,
          tx_hash: paymentType === "usdt" ? (formData.get("tx_hash") || "").toString().trim() : null,
          proof_image_url: proofImageUrl,
          proof_note: paymentType === "oro" || paymentType === "usdt" ? (formData.get("proof_note") || "").toString().trim() : null
        };

        const { error: insertError } = await supabaseClient
          .from("payments")
          .insert([payload]);

        if (insertError) {
          console.error(insertError);
          alert("No se pudo enviar el comprobante.");
          return;
        }

        const paymentTelegramText = `
<b>💰 Nuevo pago recibido</b>

Usuario: ${userData.full_name || userData.username || "Usuario"}
Email: ${userData.email || "No indicado"}
Créditos: ${Number(selectedCredits || 0)}
Monto: ${Number(selectedPrice?.price || 0)} ${paymentType === "oro" ? "ORO" : paymentType === "usdt" ? "USDT" : "PESOS"}
Método: ${paymentType}
Número comprador: ${formData.get("transfer_phone") || userData.phone || "No indicado"}
Referencia: ${paymentType === "oro" ? "pago-por-oro" : paymentType === "usdt" ? "pago-usdt" : formData.get("reference") || "Sin referencia"}
Fecha: ${formData.get("payment_date") || new Date().toISOString().split("T")[0]}
Hora: ${formData.get("payment_time") || new Date().toLocaleTimeString("es-ES", { hour12: false })}
`.trim();

        await sendTelegramMessage(
          TELEGRAM_ADMIN_BOT_TOKEN,
          TELEGRAM_ADMIN_CHAT_ID,
          paymentTelegramText
        );

        alert("Tu comprobante fue enviado correctamente y será revisado por el administrador en un maximo de 2 horas despues de la compra.");
        const historial = await fetchCreditHistory(userData.id);
        renderCreditHistory(historial, "profileHistoryList");
      } catch (err) {
        console.error(err);
        alert("Hubo un error al enviar el comprobante.");
      } finally {
        hideGlobalLoader();
        setButtonLoading(submitBtn, false);
      }
    });
  };

  const renderPackCards = (paymentType) => {
    const packs = getPacksByPayment(paymentType, userData.country);
    const selectedPack = document.querySelector(".credit-pack-card.selected")?.dataset.pack || packs[0].credits;

    creditsContent.innerHTML = `
      <div>
        <h3>Créditos actuales</h3>
        <p><strong>${userData.credits || 0}</strong> créditos</p>

        <div class="credit-pack-grid">
          ${packs.map((pack) => `
            <div
              class="credit-pack-card ${Number(selectedPack) === pack.credits ? "selected" : ""}"
              data-pack="${pack.credits}"
            >
              <div class="credit-pack-meta">${pack.label}</div>
              <div class="credit-pack-amount">${pack.credits}</div>
              <div class="credit-pack-meta">créditos</div>
              <div class="credit-pack-price">${pack.price} ${pack.currency}</div>
            </div>
          `).join("")}
        </div>

        <div class="payment-list">
          <div class="payment-item">
            <h4>Comprar créditos</h4>
            <p>Elige tu método de pago:</p>

            <div class="payment-option-list">
              ${getAvailablePaymentTypes().includes("transferencia") ? `
                <button class="payment-option btn secondary ${activePaymentType === "transferencia" ? "active" : ""}" data-payment="transferencia" type="button">
                  Transferencia
                </button>
              ` : ""}

              ${getAvailablePaymentTypes().includes("saldo") ? `
                <button class="payment-option btn secondary ${activePaymentType === "saldo" ? "active" : ""}" data-payment="saldo" type="button">
                  Saldo
                </button>
              ` : ""}

              ${getAvailablePaymentTypes().includes("oro") ? `
                <button class="payment-option btn secondary ${activePaymentType === "oro" ? "active" : ""}" data-payment="oro" type="button">
                  Pago por oro
                </button>
              ` : ""}

              ${getAvailablePaymentTypes().includes("usdt") ? `
                <button class="payment-option btn secondary ${activePaymentType === "usdt" ? "active" : ""}" data-payment="usdt" type="button">
                  USDT
                </button>
              ` : ""}
            </div>

            <div id="paymentFormContainer"></div>
          </div>
        </div>
      </div>
    `;

    const selected = document.querySelector(".credit-pack-card.selected");
    const selectedCredits = Number(selected?.dataset.pack || packs[0].credits);
    const selectedPrice = packs.find((pack) => pack.credits === selectedCredits);

    renderPaymentForm(activePaymentType, selectedCredits, selectedPrice);

    document.querySelectorAll(".credit-pack-card").forEach((card) => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".credit-pack-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");

        const packCredits = Number(card.dataset.pack);
        const packPrice = packs.find((pack) => pack.credits === packCredits);

        renderPaymentForm(activePaymentType, packCredits, packPrice);
      });
    });

    document.querySelectorAll(".payment-option").forEach((button) => {
      button.addEventListener("click", () => {
        activePaymentType = button.dataset.payment;
        renderPackCards(activePaymentType);
      });
    });
  };

  activePaymentType = getAvailablePaymentTypes()[0] || "oro";
  renderPackCards(activePaymentType);
}