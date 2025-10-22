import SallyButton from "../../../components/buttons/SallyButton";
import { useNavigate } from "react-router-dom";
import { Pill, Search, MapPin } from "lucide-react";

export default function HomeScreen({ onStart }) {
    const navigate = useNavigate();
    
    return (
    <section className="min-h-screen bg-gradient-to-b from-[#D6AC92]/10 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-screen text-center">
        {/* Logo o Icono Principal */}
        <div className="w-24 h-24 bg-[#D6AC92] rounded-full flex items-center justify-center mb-8 shadow-lg transform hover:scale-105 transition-transform">
          <Pill className="w-12 h-12 text-white" />
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl font-bold mb-4 text-[#3B2A26] tracking-tight">
          Consulta tus Medicamentos
        </h1>
        <h2 className="text-xl text-gray-600 mb-8">
          Con Sally, tu asistente virtual
        </h2>

        {/* Descripción y Características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Search className="w-8 h-8 text-[#D6AC92] mb-3" />
            <h3 className="font-semibold mb-2">Disponibilidad</h3>
            <p className="text-gray-600 text-sm">Encuentra tus medicamentos al instante</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <MapPin className="w-8 h-8 text-[#D6AC92] mb-3" />
            <h3 className="font-semibold mb-2">Ubicación</h3>
            <p className="text-gray-600 text-sm">Localiza la sede más cercana</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <Pill className="w-8 h-8 text-[#D6AC92] mb-3" />
            <h3 className="font-semibold mb-2">Alternativas</h3>
            <p className="text-gray-600 text-sm">Descubre opciones equivalentes</p>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="animate-bounce">
          <SallyButton 
            onClick={() => navigate("/selection")}
            className="text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-shadow"
          >
            Comenzar Consulta
          </SallyButton>
        </div>

        {/* Texto de Confianza */}
        <p className="mt-8 text-sm text-gray-500">
          Respuestas rápidas y precisas para todas tus consultas médicas
        </p>
      </div>
    </section>
  );
}
