import api from "./api";

const assistantService = {
  // Ask the assistant a question. Expects a string and returns a string (or throws).
  async ask(text) {
    if (!text) return "";
    // Example POST to /assistant/ask on NestJS backend
    const payload = { text };
    const data = await api.request("/assistant/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Expecting { reply: string } or plain string
    if (data && typeof data === "object" && data.reply) return data.reply;
    if (typeof data === "string") return data;
    return "(sin respuesta)";
  },

  // Placeholder for other endpoints (history, suggestions, etc.)
  async history() {
    return api.request("/assistant/history");
  },
};

export default assistantService;
