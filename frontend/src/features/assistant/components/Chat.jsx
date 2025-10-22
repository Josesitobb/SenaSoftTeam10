import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import { MessageSquare, Loader } from "lucide-react";
import { useChat } from "../hooks/useChat";

export default function ChatScreen() {
  const { messages, sendMessage, loading, error } = useChat();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#D6AC92]/10 to-white">
      {/* Header */}
      <header className="bg-[#D6AC92] py-4 px-6 flex items-center gap-3 shadow-md">
        <MessageSquare className="text-white" size={24} />
        <h1 className="text-xl font-bold text-white tracking-wide">Chat con Sally</h1>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <MessageSquare size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium">¡Bienvenido al chat!</p>
              <p className="text-sm">Esperando conexión con Sally...</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))
          )}
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader size={20} className="animate-spin" />
              <p>Sally está pensando...</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <InputBar onSend={sendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}
