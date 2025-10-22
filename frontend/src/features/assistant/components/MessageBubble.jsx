import { MessageSquare, User, AlertCircle } from "lucide-react";

export default function MessageBubble({ message }) {
  // If message is missing, render a placeholder (or nothing)

  if (!message) return null;
  
  const isUser = message.sender === "user";
  const text = message.text ?? "";
  const isError = message.isError;
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}>
      {!isUser && (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md ${
          isError ? "bg-red-500" : "bg-[#D6AC92]"
        }`}>
          {isError ? <AlertCircle size={16} /> : <MessageSquare size={16} />}
        </div>
      )}
      
      <div className={`
        group relative max-w-[80%] md:max-w-[60%] 
        ${isUser ? 'bg-[#82C7E3]' : isError ? 'bg-red-100 border border-red-300' : 'bg-white border border-gray-100'} 
        p-4 rounded-2xl shadow-sm
        hover:shadow-md transition-shadow
      `}>
        <p className={`text-[15px] leading-relaxed ${
          isUser ? 'text-white' : isError ? 'text-red-800' : 'text-gray-800'
        }`}>
          {text}
        </p>

        {/* Información adicional del medicamento */}
        {!isUser && message.medicamento && (
          <div className="mt-3 pt-3 border-t border-gray-300 space-y-1 text-sm">
            <p className="text-gray-700">
              <strong>💊 Medicamento:</strong> {message.medicamento}
            </p>
            {message.ubicaciones && (
              <p className="text-gray-700">
                <strong>📍 Ubicaciones:</strong> {message.ubicaciones}
              </p>
            )}
            {message.status && (
              <p className="text-gray-700">
                <strong>Status:</strong> {message.status}
              </p>
            )}
          </div>
        )}
        
        <div className={`
          absolute top-0 ${isUser ? 'right-0' : 'left-0'} h-3 w-3 
          transform ${isUser ? 'translate-x-1/2' : '-translate-x-1/2'} -translate-y-1/2 rotate-45
          ${isUser ? 'bg-[#82C7E3]' : isError ? 'bg-red-100 border-t border-l border-red-300' : 'bg-white border-t border-l border-gray-100'}
        `}></div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#82C7E3] flex items-center justify-center text-white shadow-md">
          <User size={16} />
        </div>
      )}
    </div>
  );
}
