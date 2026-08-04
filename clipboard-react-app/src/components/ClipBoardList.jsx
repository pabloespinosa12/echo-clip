import ClipboardItem from "./ClipBoardItem";

function ClipboardList({ clipboardHistory }) {
  return (
    <div className="clipboard-list">
      {clipboardHistory.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No clipboard history yet</p>
          <p className="empty-message">Copy some text and it will appear here.</p>
        </div>
      ) : (
        clipboardHistory.map((text, index) => (
          <ClipboardItem key={index} text={text} index={index} />
        ))
      )}
    </div>
  );
}

export default ClipboardList;
