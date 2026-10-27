async function sendTelegramMessage(botToken, chatId, text) {
  if (!botToken || !chatId || !text) {
    console.warn("Telegram no enviado: faltan datos.", { botToken, chatId, text });
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      })
    });

    const result = await response.json();
    console.log("Telegram response:", result);
    return result;
  } catch (error) {
    console.error("Error enviando Telegram:", error);
    return null;
  }
}