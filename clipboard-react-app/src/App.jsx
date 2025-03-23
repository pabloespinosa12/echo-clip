import { useState, useEffect, useRef } from "react";
import ClipboardList from "./components/ClipBoardList";
import SearchBar from "./components/SearchBar";

function App() {
  const [clipboardHistory, setClipboardHistory] = useState([]);
  const isListenerAttached = useRef(false); // Fix issue in dev mode likely because of HMR 
  useEffect(() => {
    if (!window.electron) { // Just for dev purposes
      console.warn("Electron API not available. Running in a regular browser?");
      return;
    }

    if (isListenerAttached.current) {
      console.warn("Clipboard listener already attached. Skipping.");
      return;
    }
    isListenerAttached.current = true;

    const clipboardListener = (text) => {
      console.log("Clipboard event received in React:", text);
      setClipboardHistory((prev) => [text, ...prev]);
    };
 
    // Attach the listener
    console.log("Attaching clipboard event listener");
    window.electron.onClipboardUpdate(clipboardListener);
  }, []);
  
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = clipboardHistory.filter((text) =>
    text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <ClipboardList clipboardHistory={filteredHistory} />
    </div>
  );
}

export default App;
