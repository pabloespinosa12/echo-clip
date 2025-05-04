import ClipboardItem from "./ClipboardItem";

function ClipboardList({ clipboardHistory }) {
  return (
    <div className="clipboard-list">
      {clipboardHistory.length === 0 ? (
        <p className="empty-message">No clipboard history</p>
      ) : (
        clipboardHistory.map((text, index) => (
          <ClipboardItem key={index} text={text} />
        ))
      )}
    </div>
  );
}

export default ClipboardList;
