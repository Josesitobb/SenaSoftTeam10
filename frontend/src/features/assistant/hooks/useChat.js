import { useState, useEffect } from "react";
import { getInitialSession, sendMessage as apiSendMessage } from "../services/api";

/**
 * Hook personalizado para manejar la lógica del chat con IA
 * Gestiona sesión, mensajes y comunicación con la API
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializa la sesión al montar el componente
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        const response = await getInitialSession();
        setSessionId(response.sessionId);
        // Agregar mensaje inicial del bot
        setMessages([
          {
            sender: "bot",
            text: response.message,
            sessionId: response.sessionId,
          },
        ]);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const sendMessage = async (text) => {
    if (!sessionId || !text.trim()) return;

    try {
      setLoading(true);
      // Agregar mensaje del usuario
      const userMsg = { sender: "user", text };
      setMessages((prev) => [...prev, userMsg]);

      // Enviar al API
      const response = await apiSendMessage(sessionId, text);

      // Agregar respuesta del bot
      const botMsg = {
        sender: "bot",
        text: response.reply,
        status: response.status,
        medicamento: response.medicamento_consultado,
        ubicaciones: response.ubicaciones_encontradas,
        user: response.user,
      };

      setMessages((prev) => [...prev, botMsg]);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
      // Agregar mensaje de error
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: No se pudo enviar el mensaje", isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, sessionId, loading, error };
}
