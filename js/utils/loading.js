function showGlobalLoader(message = "Procesando...") {
  let loader = document.getElementById("globalLoader");

  if (!loader) {
    loader = document.createElement("div");
    loader.id = "globalLoader";
    loader.style.position = "fixed";
    loader.style.left = "50%";
    loader.style.bottom = "20px";
    loader.style.transform = "translateX(-50%)";
    loader.style.zIndex = "99999";
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.width = "auto";
    loader.style.maxWidth = "420px";

    loader.innerHTML = `
      <div style="
        background: rgba(17, 24, 39, 0.95);
        border: 1px solid rgba(255,255,255,0.08);
        padding: 14px 20px;
        border-radius: 999px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.28);
        text-align: center;
        font-weight: 700;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <div style="font-size: 18px;">⏳</div>
        <div id="globalLoaderText">${message}</div>
      </div>
    `;

    document.body.appendChild(loader);
  } else {
    const text = document.getElementById("globalLoaderText");
    if (text) text.textContent = message;
    loader.style.display = "flex";
  }
}

function hideGlobalLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

function setButtonLoading(button, isLoading, text = "Procesando...") {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = text;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.background = "#111";
  toast.style.color = "#fff";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "999px";
  toast.style.zIndex = "99999";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "600";
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2200);
}