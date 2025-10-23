import { useState, useEffect, useRef } from "react";
import { Volume2, Loader, MessageCircle, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getInitialSession, sendMessage as apiSendMessage } from "../services/api";

export default function VoiceScreen() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const sessionIdRef = useRef(null); // Ref para mantener siempre el valor actual
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [hideInput, setHideInput] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const inputTimeoutRef = useRef(null);
  const speakingTextRef = useRef(null);

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "es-ES";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Determinar si el último resultado es final (Web Speech API usa isFinal por resultado)
        const lastResult = event.results[event.results.length - 1];
        const isFinal = lastResult && lastResult.isFinal;

        console.log('🎤 Transcripción capturada:', transcript, 'isFinal:', isFinal);

        if (isFinal && transcript.trim()) {
          // Normalizar el texto inmediatamente para quitar puntuación final
          const normalized = transcript.trim().replace(/[\.\?!,;:。？！，；：…]+$/u, "").trim();
          console.log('✅ Texto normalizado:', normalized);
          setCurrentMessage(normalized);
          // Esperar 1 segundo para que el usuario vea qué se va a enviar, luego enviar automáticamente
          setTimeout(() => {
            console.log('📤 Enviando mensaje al backend:', normalized);
            // Usar una función que espere a que sessionId esté disponible
            sendMessageWhenReady(normalized);
          }, 1000);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Inicializar sesión
  useEffect(() => {
    const initializeSession = async () => {
      // Evitar múltiples inicializaciones
      if (sessionIdRef.current) {
        console.log('⚠️ Sesión ya inicializada, saltando...');
        return;
      }
      
      try {
        setLoading(true);
        console.log('🔄 Inicializando sesión...');
        const response = await getInitialSession();
        console.log('✅ Sesión obtenida:', response);
        setSessionId(response.sessionId);
        sessionIdRef.current = response.sessionId; // Guardar en ref también
        console.log('💾 SessionId guardado:', response.sessionId);
        setMessages([{ sender: "bot", text: response.message }]);
        // Reproducir mensaje inicial
        speakMessage(response.message);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Función para reproducir audio
  const speakMessage = (text) => {
    if (!text) return;

    // Cancelar cualquier audio en reproducción
    synthRef.current.cancel();
    speakingTextRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.3;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      speakingTextRef.current = null;

      // Cuando Sally termina de hablar, activar el micrófono para que el usuario pueda responder.
      // Pequeño delay para evitar que el SpeechRecognition choque con la síntesis que acaba de terminar.
      setTimeout(() => {
        try {
          // Mostrar el input y permitir escuchar
          setHideInput(false);
          if (recognitionRef.current && !isListening && !loading) {
            recognitionRef.current.start();
          }
        } catch (err) {
          // start() puede lanzar si el reconocimiento ya está activo; simplemente registrar.
          console.warn('No se pudo iniciar reconocimiento automáticamente:', err);
        }
      }, 250);
    };
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsPlaying(false);
    };

    synthRef.current.speak(utterance);
  };

  // Omitir la voz actual (bot) y activar micrófono inmediatamente
  const skipSpeech = () => {
    try {
      // Cancelar síntesis en curso
      synthRef.current.cancel();
    } catch (err) {
      console.warn('Error cancelando síntesis al omitir:', err);
    }

    // Limpiar estado de reproducción y ref
    setIsPlaying(false);
    speakingTextRef.current = null;

    // Pequeño delay antes de iniciar reconocimiento para evitar choques
    setTimeout(() => {
      try {
        setHideInput(false);
        if (recognitionRef.current && !isListening && !loading) {
          recognitionRef.current.start();
        }
      } catch (err) {
        console.warn('No se pudo iniciar reconocimiento al omitir voz:', err);
      }
    }, 150);
  };

  // Función que espera a que sessionId esté disponible antes de enviar
  const sendMessageWhenReady = (text) => {
    const checkAndSend = () => {
      if (sessionIdRef.current) {
        console.log('✅ SessionId disponible:', sessionIdRef.current, '- enviando mensaje');
        handleSendMessage(text);
      } else {
        console.log('⏳ Esperando sessionId...');
        setTimeout(checkAndSend, 100); // Reintentar cada 100ms
      }
    };
    checkAndSend();
  };

  // Normalizar texto: quitar puntuación final indeseada y formatear números (MVP)
  const normalizeText = (t) => {
    if (!t && t !== "") return t;
    const trimmed = String(t).trim();
    
    // PASO 1: Juntar números que estén separados por espacios
    // Ejemplo: "1 0 2 4 4 6 9 9 6 3" -> "1024469963"
    // Ejemplo: "102 446 99 63" -> "1024469963"
    const numbersJoined = trimmed.replace(/(\d)\s+(?=\d)/g, '$1');
    
    // PASO 2: Eliminar puntos, comas y signos de interrogación/exclamación al final
    const cleaned = numbersJoined.replace(/[\.\?!,;:。？！，；：…]+$/u, "");
    
    return cleaned.trim();
  };

  // Enviar mensaje
  const handleSendMessage = async (text) => {
    console.log('🔄 handleSendMessage llamado con:', text);
    const normalized = normalizeText(text);
    console.log('🔄 Texto después de normalizar:', normalized);
    console.log('🔄 SessionId (state):', sessionId);
    console.log('🔄 SessionId (ref):', sessionIdRef.current);
    
    // Usar sessionIdRef.current en lugar de sessionId
    const currentSessionId = sessionIdRef.current;
    
    if (!currentSessionId || normalized == null || !normalized.trim()) {
      console.log('❌ No se puede enviar - SessionId:', currentSessionId, 'Normalized:', normalized);
      return;
    }

    console.log('✅ Enviando al backend con sessionId:', currentSessionId, 'mensaje:', normalized);
    try {
      setLoading(true);
  setHideInput(true);
  // Actualizar input con la versión normalizada (quita el punto final visible)
  setCurrentMessage(normalized);

  // Agregar mensaje del usuario (texto normalizado)
  setMessages((prev) => [...prev, { sender: "user", text: normalized }]);

  // Enviar al API usando currentSessionId (de la ref, no del estado)
  const response = await apiSendMessage(currentSessionId, normalized);

      // Agregar respuesta del bot
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response.reply,
          medicamento: response.medicamento_consultado,
          ubicaciones: response.ubicaciones_encontradas,
        },
      ]);

      // Reproducir respuesta
      speakMessage(response.reply);

      setError(null);

      // Ocultar input por 3 segundos
      if (inputTimeoutRef.current) clearTimeout(inputTimeoutRef.current);
      inputTimeoutRef.current = setTimeout(() => {
        setHideInput(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
      const errorMsg = "Error al comunicarse con Sally";
      setMessages((prev) => [...prev, { sender: "bot", text: errorMsg, isError: true }]);
      speakMessage(errorMsg);
      setHideInput(false);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar grabación de voz
  const startListening = () => {
    if (recognitionRef.current && !isListening && !isPlaying) {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#D6AC92]/20 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#D6AC92] to-[#b89878] py-6 px-6 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="text-white" size={28} />
          <h1 className="text-2xl font-bold text-white tracking-wide">Sally - Modo Voz</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/chat")}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <MessageCircle size={18} />
            Chat
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Home size={18} />
            Inicio
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-6 py-4 rounded-2xl ${
                  msg.sender === "user"
                    ? "bg-[#D6AC92] text-white rounded-br-none"
                    : msg.isError
                    ? "bg-red-200 text-red-800 rounded-bl-none"
                    : "bg-white text-gray-800 shadow-md rounded-bl-none"
                }`}
              >
                <p className="text-lg leading-relaxed">{msg.text}</p>
                {msg.medicamento && (
                  <div className="mt-3 pt-3 border-t border-current/20 text-sm opacity-90">
                    <p>
                      <strong>💊 Medicamento:</strong> {msg.medicamento}
                    </p>
                    <p>
                      <strong>📍 Ubicaciones:</strong> {msg.ubicaciones}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white shadow-md px-6 py-4 rounded-2xl rounded-bl-none flex items-center gap-3">
                <Loader size={20} className="animate-spin text-[#D6AC92]" />
                <p className="text-gray-600">Sally está procesando...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="bg-white border-t border-gray-200 py-6 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          {/* Status Indicator */}
          <div className="mb-4 text-center">
            {isPlaying && (
              <p className="text-purple-600 font-semibold flex items-center justify-center gap-2">
                <Volume2 size={18} className="animate-pulse" />
                Sally está hablando...
              </p>
            )}
            {/* Botón para omitir voz si el texto es largo */}
            {isPlaying && speakingTextRef.current && speakingTextRef.current.length > 120 && (
              <div className="mt-2 flex justify-center">
                <button
                  onClick={skipSpeech}
                  className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md shadow-sm"
                >
                  Omitir voz
                </button>
              </div>
            )}
            {isListening && (
              <p className="text-blue-600 font-semibold flex items-center justify-center gap-2">
                <Loader size={18} className="animate-spin" />
                Escuchando tu mensaje...
              </p>
            )}
            {!isPlaying && !isListening && !loading && (
              <p className="text-gray-600">Presiona el botón para hablar</p>
            )}
          </div>

          {/* Voice Button */}
          <div className="flex justify-center">
            <button
              onClick={startListening}
              disabled={isListening || isPlaying || loading}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-lg transition-all transform ${
                isListening || isPlaying || loading
                  ? "bg-gray-400 scale-95 cursor-not-allowed"
                  : "bg-gradient-to-br from-[#D6AC92] to-[#b89878] hover:scale-110 active:scale-95 shadow-lg"
              }`}
            >
              {isListening ? (
                <Loader size={32} className="animate-spin" />
              ) : (
                <Volume2 size={32} />
              )}
            </button>
          </div>

          {/* Mostrar lo que se va a enviar (read-only) */}
          {currentMessage && !hideInput && (
            <div className="mt-6 animate-fadeIn">
              <input
                type="text"
                value={currentMessage}
                readOnly
                placeholder="Tu mensaje aparecerá aquí..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-700 cursor-default"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
