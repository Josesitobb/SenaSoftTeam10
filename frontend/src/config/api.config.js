// src/config/api.config.js
/**
 * Configuración centralizada de la API
 * Permite usar variables de entorno o valores por defecto
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  ENDPOINTS: {
    // Endpoint inicial para obtener sessionId
    GET_SESSION: "/api/ia",
    // Endpoint para enviar mensajes con sessionId
    SEND_MESSAGE: (sessionId) => `/api/ia/${sessionId}`,
  },
  TIMEOUT: 30000, // 30 segundos
};

export default API_CONFIG;
