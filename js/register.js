async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showGlobalLoader("Creando tu cuenta...");
    setButtonLoading(submitBtn, true, "Creando...");

    try {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const email = data.email?.toString().trim();
      const password = data.password?.toString().trim();
      const recoveryKey = data.recovery_key?.toString().trim();
      const fullName = data.full_name?.toString().trim();
      const username = data.username?.toString().trim().toLowerCase();
      const country = data.country?.toString().trim();
      const nationality = data.nationality?.toString().trim();
      const phone = data.phone?.toString().trim();
      const bio = data.bio?.toString().trim();

      if (!email || !password || !recoveryKey || !fullName || !username || !nationality) {
        alert("Debes completar nombre, usuario, email, contraseña, palabra clave y nacionalidad.");
        return;
      }

      if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      if (recoveryKey.length < 4) {
        alert("La palabra clave debe tener al menos 4 caracteres.");
        return;
      }

      if (username.length < 3) {
        alert("El nombre de usuario debe tener al menos 3 caracteres.");
        return;
      }

      const passwordHash = await sha256(password);
      const recoveryKeyHash = await sha256(recoveryKey);

      const normalizedPhone = phone ? phone.replace(/\s+/g, "").trim() : "";
      const phoneHash = normalizedPhone ? await sha256(normalizedPhone) : "";

      const { data: bannedPhone, error: phoneSearchError } = await supabaseClient
        .from("banned_phones")
        .select("id")
        .eq("phone_hash", phoneHash)
        .maybeSingle();

      if (phoneSearchError) {
        console.error(phoneSearchError);
        alert("No se pudo verificar el teléfono.");
        return;
      }

      if (bannedPhone) {
        alert("Este teléfono está bloqueado por fraude confirmado.");
        return;
      }

      const { data: existingEmail, error: emailError } = await supabaseClient
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (emailError) {
        console.error(emailError);
        alert("No se pudo validar el email.");
        return;
      }

      if (existingEmail) {
        alert("Este correo ya está registrado.");
        return;
      }

      const { data: existingUsername, error: usernameError } = await supabaseClient
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (usernameError) {
        console.error(usernameError);
        alert("No se pudo validar el nombre de usuario.");
        return;
      }

      if (existingUsername) {
        alert("Ese nombre de usuario ya está en uso. Elige otro.");
        return;
      }

      const newUserId = crypto.randomUUID();
      const welcomeTrialExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabaseClient
        .from("users")
        .insert([
          {
            id: newUserId,
            email,
            full_name: fullName,
            username,
            password_hash: passwordHash,
            recovery_key_hash: recoveryKeyHash,
            country,
            nationality,
            phone: normalizedPhone || phone,
            phone_hash: phoneHash,
            bio,
            payment_country: country,
            payment_method: "",
            membership_status: "welcome",
            membership_expires_at: welcomeTrialExpiresAt,
            credits: 0,
            is_banned: false,
            is_scammer: false,
            is_admin: false,
            is_membership_active: true,
            rating: 0,
            reviews_count: 0
          }
        ]);

      if (insertError) {
        console.error(insertError);
        alert("Hubo un error al crear la cuenta.");
        return;
      }

      const welcomeRecord = {
        user_id: newUserId,
        type: "welcome_trial",
        amount: 0,
        currency: "CREDITS",
        status: "approved",
        payment_method: "welcome_coupon",
        reference: `welcome-trial-${Date.now()}`,
        payment_date: new Date().toISOString().split("T")[0],
        payment_time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
        payment_notes: "Cupón de bienvenida - 3 días gratis",
        credit_amount: 0,
        created_at: new Date().toISOString()
      };

      const { error: welcomePaymentError } = await supabaseClient
        .from("payments")
        .insert([welcomeRecord]);

      if (welcomePaymentError) {
        console.error("Error registrando cupón de bienvenida:", welcomePaymentError);
      }

      alert("Cuenta creada correctamente. Tu prueba gratuita de 3 días ya está activa.");
      window.location.href = "login.html";
    } catch (err) {
      console.error("Error al registrar:", err);
      alert("Hubo un error al crear la cuenta.");
    } finally {
      hideGlobalLoader();
      setButtonLoading(submitBtn, false);
    }
  });
});