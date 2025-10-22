import { useState } from "react";
import assistantService from "../services/assistantService";

export function useChat() {
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text) => {
    const newMsg = { sender: "user", text };
    setMessages((prev) => [...prev, newMsg]);

    const response = await assistantService.ask(text);
    setMessages((prev) => [...prev, { sender: "bot", text: response }]);
  };

  return { messages, sendMessage };
}
