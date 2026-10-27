async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("recoverForm");

  if (!form) return;

  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    showGlobalLoader("Cambiando contraseña...");
    setButtonLoading(submitBtn, true, "Cambiando...");

    try {
      const formData = new FormData(form);
      const email = formData.get("email")?.toString().trim();
      const recoveryKey = formData.get("recovery_key")?.toString().trim();
      const newPassword = formData.get("new_password")?.toString();
      const confirmPassword = formData.get("confirm_password")?.toString();

      if (!email || !recoveryKey || !newPassword || !confirmPassword) {
        alert("Debes completar todos los campos.");
        return;
      }

      if (newPassword.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      const recoveryKeyHash = await sha256(recoveryKey);
      const passwordHash = await sha256(newPassword);

      const { data: user, error: lookupError } = await supabaseClient
        .from("users")
        .select("id")
        .eq("email", email)
        .eq("recovery_key_hash", recoveryKeyHash)
        .maybeSingle();

      if (lookupError) {
        console.error(lookupError);
        alert("No se pudo verificar la clave.");
        return;
      }

      if (!user) {
        alert("Email o palabra clave incorrectos.");
        return;
      }

      const { error: updateError } = await supabaseClient
        .from("users")
        .update({
          password_hash: passwordHash
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(updateError);
        alert("No se pudo cambiar la contraseña.");
        return;
      }

      alert("Contraseña cambiada correctamente.");
      window.location.href = "login.html";
    } catch (err) {
      console.error("Error de recuperación:", err);
      alert("Hubo un error al intentar recuperar la cuenta.");
    } finally {
      hideGlobalLoader();
      setButtonLoading(submitBtn, false);
    }
  });
});