import { useState } from "react";
import SallyButton from "../../../components/buttons/SallyButton";
import { Send } from "lucide-react";

export default function InputBar({ onSend, disabled = false }) {
  const [value, setValue] = useState("");

  const submit = () => {
    // Normalizar texto antes de enviar: quitar puntuación final indeseada
    const normalizeText = (t) => {
      if (t == null) return t;
      const trimmed = String(t).trim();
      return trimmed.replace(/[\.\?!,;:。？！，；：…]+$/u, "").trim();
    };

    const text = normalizeText(value);
    if (!text || disabled) return;
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
                     transition-all placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Escribe tu consulta aquí..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !disabled && submit()}
            disabled={disabled}
          />
        </div>
        <SallyButton 
          onClick={submit}
          disabled={disabled}
          className="flex items-center gap-2 px-6 py-3 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="hidden md:inline">Enviar</span>
          <Send size={18} />
        </SallyButton>
      </div>
    </div>
  );
}
