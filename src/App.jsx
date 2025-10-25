import { useState } from "react";
import ApiCard from "./components/ApiCard";
import ResultBox from "./components/ResultBox";

function App() {
  const [result, setResult] = useState("");
  const callApi = async (endpoint) => {
    const res = await fetch(endpoint);
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 to-purple-900 text-white">
      <h1 className="text-3xl font-bold text-center p-6">🦈 Gura-API Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 p-4">
        <ApiCard name="Text-to-Speech" endpoint="/api/tts?text=Hola" onClick={callApi}/>
        <ApiCard name="OCR" endpoint="/api/ocr" onClick={callApi}/>
        <ApiCard name="Screenshot Web" endpoint="/api/screenshot?url=https://example.com" onClick={callApi}/>
        <ApiCard name="Text to QR" endpoint="/api/text2qr?text=Hola" onClick={callApi}/>
      </div>
      <ResultBox result={result}/>
    </div>
  );
}

export default App;
