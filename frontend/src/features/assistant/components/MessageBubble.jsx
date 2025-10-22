import { MessageSquare, User } from "lucide-react";

export default function MessageBubble({ message }) {
  // If message is missing, render a placeholder (or nothing)

  if (!message) return null;
  
  const isUser = message.sender === "user";
  const text = message.text ?? "";
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#D6AC92] flex items-center justify-center text-white shadow-md">
          <MessageSquare size={16} />
        </div>
      )}
      
      <div className={`
        group relative max-w-[80%] md:max-w-[60%] 
        ${isUser ? 'bg-[#82C7E3]' : 'bg-white border border-gray-100'} 
        p-4 rounded-2xl shadow-sm
        hover:shadow-md transition-shadow
      `}>
        <p className={`text-[15px] leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
          {text}
        </p>
        <div className={`
          absolute top-0 ${isUser ? 'right-0' : 'left-0'} h-3 w-3 
          transform ${isUser ? 'translate-x-1/2' : '-translate-x-1/2'} -translate-y-1/2 rotate-45
          ${isUser ? 'bg-[#82C7E3]' : 'bg-white border-t border-l border-gray-100'}
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
