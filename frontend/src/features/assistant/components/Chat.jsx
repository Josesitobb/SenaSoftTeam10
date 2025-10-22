import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import { MessageSquare } from "lucide-react";

export default function ChatScreen({ messages = [], onSend }) {
  // Ensure messages is always an array to avoid `.map` on undefined
  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#D6AC92]/10 to-white">
      {/* Header */}
      <header className="bg-[#D6AC92] py-4 px-6 flex items-center gap-3 shadow-md">
        <MessageSquare className="text-white" size={24} />
        <h1 className="text-xl font-bold text-white tracking-wide">Chat con Sally</h1>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {safeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <MessageSquare size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium">¡Bienvenido al chat!</p>
              <p className="text-sm">Escribe un mensaje para comenzar</p>
            </div>
          ) : (
            safeMessages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))
          )}
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <InputBar onSend={onSend} />
        </div>
      </div>
    </div>
  );
}
