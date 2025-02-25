function SearchBar({ searchTerm, setSearchTerm }) {
    return (
      <input
        className="search-bar"
        type="text"
        placeholder="Search clipboard..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    );
  }
  
  export default SearchBar;  