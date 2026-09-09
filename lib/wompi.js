import { createHash } from "node:crypto";

// Documentación oficial: https://docs.wompi.co/docs/colombia/widget-checkout-web/
// El Web Checkout hospedado (checkout.wompi.co) es el mismo para ambos
// ambientes — Wompi detecta el ambiente por el prefijo de tu llave pública.
// La API de consulta (GET /transactions/:id) SÍ cambia de dominio según el
// ambiente, así que lo detectamos automáticamente por el prefijo de la llave.
const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

function apiBaseUrl() {
  const publicKey = process.env.WOMPI_PUBLIC_KEY || "";
  return publicKey.startsWith("pub_test_")
    ? "https://sandbox.wompi.co/v1"
    : "https://production.wompi.co/v1";
}

function sha256Hex(input) {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

// Paso 3 de la documentación de Wompi: "Genera una firma de integridad".
// IMPORTANTE: esto se hace siempre en el servidor, nunca en el navegador,
// porque necesita el secreto de integridad (privado).
export function generateIntegritySignature({ reference, amountInCents, currency = "COP" }) {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret) throw new Error("Falta configurar WOMPI_INTEGRITY_SECRET");
  return sha256Hex(`${reference}${amountInCents}${currency}${secret}`);
}

// Arma la URL del Web Checkout de Wompi a la que se redirige al cliente.
// Todo pasa como parámetros de una petición GET — nada de esto expone el
// secreto de integridad, solo el resultado (la firma) ya calculada.
export function buildWompiCheckoutUrl({ reference, amountInCents, currency = "COP", redirectUrl, customerEmail }) {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!publicKey) throw new Error("Falta configurar WOMPI_PUBLIC_KEY");

  const signature = generateIntegritySignature({ reference, amountInCents, currency });
  const params = new URLSearchParams({
    "public-key": publicKey,
    currency,
    "amount-in-cents": String(amountInCents),
    reference,
    "signature:integrity": signature,
  });
  if (redirectUrl) params.set("redirect-url", redirectUrl);
  if (customerEmail) params.set("customer-data:email", customerEmail);

  return `${WOMPI_CHECKOUT_URL}?${params.toString()}`;
}

// Consulta el estado real de una transacción directamente en la API de
// Wompi (no hace falta llave privada para esta consulta, solo la pública).
export async function fetchWompiTransaction(transactionId) {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const res = await fetch(`${apiBaseUrl()}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${publicKey}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

// Verifica que un evento (webhook) realmente venga de Wompi, siguiendo el
// algoritmo oficial: concatenar los valores de "signature.properties" (en el
// orden que Wompi indique), agregar el timestamp del evento y el secreto de
// eventos, y comparar el SHA256 resultante contra "signature.checksum".
// https://docs.wompi.co/docs/colombia/eventos-pagos-a-terceros/
export function verifyWompiEventChecksum(eventPayload) {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  if (!secret) return false;
  const { data, signature, timestamp } = eventPayload || {};
  if (!data || !signature?.properties || !signature?.checksum || !timestamp) return false;

  const concatenated = signature.properties
    .map((path) => path.split(".").reduce((obj, key) => obj?.[key], data))
    .join("");
  const computed = sha256Hex(`${concatenated}${timestamp}${secret}`);
  return computed === signature.checksum;
}

export function wompiStatusToEstadoPago(status) {
  if (status === "APPROVED") return "Pagado";
  if (status === "DECLINED" || status === "ERROR" || status === "VOIDED") return "Rechazado";
  return "Pendiente";
}
