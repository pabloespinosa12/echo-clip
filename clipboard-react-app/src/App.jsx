import { useState } from "react";
import ClipboardList from "./components/ClipBoardList";
import SearchBar from "./components/SearchBar";

function App() {
  const [clipboardHistory, setClipboardHistory] = useState([
    "Example copied text 1",
    "Another copied text",
    "Yet another example",
  ]);
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
