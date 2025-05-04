const handleOnClickItem = (text) => {
  if (!window.electron) { // Just for dev purposes
    console.warn("Electron API not available. Running in a regular browser?");
    return;
  }
  window.electron.copyText(text);
}

function ClipboardItem({ text }) {
    return <div className="clipboard-item" onClick={() => handleOnClickItem(text)}>{text}</div>;
}
  
export default ClipboardItem;
  