import { useState } from "react";
import SallyButton from "../../../components/buttons/SallyButton";
import { Send } from "lucide-react";

export default function InputBar({ onSend }) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text);
    setValue("");
  };

  return (
    <div className="p-4 border-t border-gray-100 bg-white shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            className="w-full px-4 py-3 text-[15px] border border-gray-200 rounded-xl 
                     focus:outline-none focus:border-[#D6AC92] focus:ring-2 focus:ring-[#D6AC92]/20 
                     transition-all placeholder:text-gray-400"
            placeholder="Escribe tu consulta aquí..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <SallyButton 
          onClick={submit}
          className="flex items-center gap-2 px-6 py-3 shadow-sm hover:shadow-md transition-all"
        >
          <span className="hidden md:inline">Enviar</span>
          <Send size={18} />
        </SallyButton>
      </div>
    </div>
  );
}
