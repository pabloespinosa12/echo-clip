const handleOnClickItem = (text) => {
  if (!window.electron) { // Just for dev purposes
    console.warn("Electron API not available. Running in a regular browser?");
    return;
  }
  window.electron.copyText(text);
}

function ClipboardItem({ text, index }) {
  const preview = text.length > 420 ? `${text.slice(0, 420)}...` : text;

  const handlePlaceholderAction = (event) => {
    event.stopPropagation();
  };

  return (
    <div
      className="clipboard-item"
      role="button"
      tabIndex={0}
      onClick={() => handleOnClickItem(text)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOnClickItem(text);
        }
      }}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <div className="clipboard-item-content">
        <p className="clipboard-item-text">{preview}</p>
      </div>

      <div className="clipboard-item-actions">
        <button
          className="item-action"
          type="button"
          onClick={handlePlaceholderAction}
          title="Pin item (coming soon)"
          aria-label="Pin item"
        >
          Pin
        </button>
        <button
          className="item-action"
          type="button"
          onClick={handlePlaceholderAction}
          title="Delete item (coming soon)"
          aria-label="Delete item"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
  
export default ClipboardItem;
  