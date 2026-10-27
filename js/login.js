async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");

  const currentUser = getCurrentUser();
  if (currentUser) {
    if (currentUser.is_admin) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "seller-panel.html";
    }
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showGlobalLoader("Iniciando sesión...");
    setButtonLoading(submitBtn, true, "Entrando...");

    try {
      const formData = new FormData(form);
      const email = formData.get("email")?.toString().trim();
      const password = formData.get("password")?.toString();

      if (!email || !password) {
        alert("Debes completar email y contraseña.");
        return;
      }

      const passwordHash = await sha256(password);

      const { data: user, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error(error);
        alert("No se pudo verificar tus datos.");
        return;
      }

      if (!user) {
        alert("Credenciales incorrectas.");
        return;
      }

      if (user.password_hash !== passwordHash) {
        alert("Credenciales incorrectas.");
        return;
      }

      if (user.is_banned || user.is_scammer) {
        alert("Tu cuenta ha sido bloqueada por fraude o incumplimiento para cuaquier duda escribir a nuestroad admins 58874007.");
        clearUserSession();
        return;
      }

      saveUserSession({
        user: {
          id: user.id,
          email: user.email,
          is_admin: !!user.is_admin
        }
      });

      if (user.is_admin) {
        window.location.href = "admin.html";
        return;
      }

      window.location.href = "seller-panel.html";
    } catch (err) {
      console.error("Error login:", err);
      alert("Ha ocurrido un error al iniciar sesión.");
    } finally {
      hideGlobalLoader();
      setButtonLoading(submitBtn, false);
    }
  });

});