import API_CONFIG from "../../../config/api.config";

/**
 * Realiza una solicitud HTTP a la API
 * @param {string} path - Ruta de la API
 * @param {object} options - Opciones fetch
 * @returns {Promise} Respuesta de la API
 */
async function request(path, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error: ${res.status} ${text}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    return res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Obtiene sesión inicial de la IA
 * @returns {Promise<{sessionId: string, message: string}>}
 */
export async function getInitialSession() {
  return request(API_CONFIG.ENDPOINTS.GET_SESSION, { method: "GET" });
}

/**
 * Envía un mensaje con sessionId y obtiene respuesta
 * @param {string} sessionId - ID de sesión
 * @param {string} message - Mensaje del usuario
 * @returns {Promise<object>} Respuesta de la API
 */
export async function sendMessage(sessionId, message) {
  return request(API_CONFIG.ENDPOINTS.SEND_MESSAGE(sessionId), {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export default { request, getInitialSession, sendMessage };
