// Te avisa por WhatsApp (a tu número personal) usando CallMeBot — un
// servicio gratuito hecho justo para esto: mandarte notificaciones
// automáticas a ti mismo, sin necesitar una cuenta de WhatsApp Business.
// https://www.callmebot.com/blog/free-api-whatsapp-messages/
//
// Si no está configurado (falta el número o la apikey), simplemente no
// hace nada — nunca rompe el flujo de compra/reseña del cliente por un
// problema de notificaciones.
export async function sendWhatsAppToAdmin(message) {
  const phone = process.env.ADMIN_WHATSAPP_NUMBER;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apiKey) return { skipped: true };

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return { ok: res.ok, response: text };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
