import { useNavigate } from "react-router-dom";
import { Mic, MessageSquare, X, Pill } from "lucide-react";
import SallyButton from "../../../components/buttons/SallyButton";

export default function ModeSelectionScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#D6AC92]/10 to-white">
      {/* Encabezado */}
      <header className="bg-[#D6AC92] py-4 px-6 flex items-center gap-3 shadow-md">
        <Pill className="text-white" size={24} />
        <h1 className="text-xl font-bold text-white tracking-wide">SALLY</h1>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 text-center">
        {/* Círculo superior con animación */}
        <div className="w-32 h-32 bg-[#D6AC92] rounded-full flex items-center justify-center mb-8 shadow-lg transform hover:scale-105 transition-transform">
          <MessageSquare size={48} className="text-white" />
        </div>

        {/* Mensaje de bienvenida */}
        <h2 className="text-2xl font-bold mb-3 text-[#3B2A26]">
          ¡Hola! ¿Cómo prefieres consultar hoy?
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Elige el método que te resulte más cómodo para interactuar con Sally
        </p>

        {/* Tarjetas de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Opción de Voz */}
          <div className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
               onClick={() => navigate("/voice")}>
            <div className="w-16 h-16 bg-[#D6AC92] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Mic size={32} className="text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Conversación por Voz</h3>
            <p className="text-sm text-gray-600">Habla naturalmente con Sally</p>
          </div>

          {/* Opción de Chat */}
          <div className="group bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
               onClick={() => navigate("/chat")}>
            <div className="w-16 h-16 bg-[#82C7E3] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare size={32} className="text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Chat de Texto</h3>
            <p className="text-sm text-gray-600">Escribe tus consultas</p>
          </div>
        </div>

        {/* Botón de regreso */}
        <SallyButton
          onClick={() => navigate("/")}
          variant="secondary"
          className="!px-6 !py-2"
        >
          Volver al inicio
        </SallyButton>
      </main>
    </div>
  );
}
