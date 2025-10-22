// src/routes/AppRouter.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomeScreen from "../features/assistant/components/Home";
import ChatScreen from "../features/assistant/components/Chat";
import ModeSelectionScreen from "../features/assistant/components/SelectionScreen";
//import VoiceScreen from "../features/assistant/components/Voice";
//import ResultScreen from "../features/assistant/components/Result";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/selection" element={<ModeSelectionScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
      </Routes>
    </Router>
  );
}
