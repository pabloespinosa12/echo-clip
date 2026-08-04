import { useState, useEffect, useRef } from "react";
import ClipboardList from "./components/ClipBoardList";
import SearchBar from "./components/SearchBar";

function App() {
  const [clipboardHistory, setClipboardHistory] = useState([]);
  const [theme, setTheme] = useState("dark");
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <div className="app-container">
        <header className="app-header">
          <div className="header-copy">
            <h1 className="app-title">Clipboard</h1>
            <p className="app-subtitle">Quick access to your copied text</p>
          </div>

          <div className="header-actions" role="group" aria-label="View controls">
            <button
              className="action-btn icon"
              type="button"
              onClick={() => {}}
              aria-label="Open settings"
              title="Settings (coming soon)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M13.73 3.2a1 1 0 0 0-1.46 0l-.9.97a1 1 0 0 1-.96.28l-1.3-.34a1 1 0 0 0-1.18.7l-.38 1.3a1 1 0 0 1-.68.74l-1.29.39a1 1 0 0 0-.7 1.17l.33 1.31a1 1 0 0 1-.27.95l-.97.9a1 1 0 0 0 0 1.46l.97.9a1 1 0 0 1 .27.95l-.33 1.31a1 1 0 0 0 .7 1.17l1.29.39a1 1 0 0 1 .68.74l.38 1.3a1 1 0 0 0 1.18.7l1.3-.34a1 1 0 0 1 .96.28l.9.97a1 1 0 0 0 1.46 0l.9-.97a1 1 0 0 1 .96-.28l1.3.34a1 1 0 0 0 1.18-.7l.38-1.3a1 1 0 0 1 .68-.74l1.29-.39a1 1 0 0 0 .7-1.17l-.33-1.31a1 1 0 0 1 .27-.95l.97-.9a1 1 0 0 0 0-1.46l-.97-.9a1 1 0 0 1-.27-.95l.33-1.31a1 1 0 0 0-.7-1.17l-1.29-.39a1 1 0 0 1-.68-.74l-.38-1.3a1 1 0 0 0-1.18-.7l-1.3.34a1 1 0 0 1-.96-.28l-.9-.97ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
              </svg>
            </button>
            <button
              className="action-btn ghost"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark and light mode"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              className="action-btn danger"
              type="button"
              onClick={() => {}}
              aria-label="Clear clipboard history"
              title="Coming soon"
            >
              Clear all
            </button>
          </div>
        </header>

        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <ClipboardList clipboardHistory={filteredHistory} />
      </div>
    </div>
  );
}

export default App;
