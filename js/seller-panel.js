document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const userData = await fetchUserProfile(user.id);

  if (!userData) {
    alert("Tu perfil no existe.");
    clearUserSession();
    window.location.href = "login.html";
    return;
  }

  renderProfile(userData);
  renderCredits(userData);
  renderPromotions(userData);
  renderOffers(userData);

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      const panelToShow = document.getElementById(`${target}-panel`);
      if (panelToShow) panelToShow.classList.add("active");
    });
  });
});