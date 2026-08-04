function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="search-wrapper">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        className="search-bar"
        type="text"
        placeholder="Search clipboard"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}

export default SearchBar;