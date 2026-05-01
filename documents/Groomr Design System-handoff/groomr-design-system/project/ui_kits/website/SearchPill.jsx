// SearchPill — the rounded-pill search bar used on hero + dashboard.

const SearchPill = ({ value, onChange, onSubmit, placeholder = "Enter your postcode, town, or city...", ctaLabel = "Search" }) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(value); }}
        className="w-full max-w-3xl mx-auto">
    <div className="bg-white rounded-full p-2 flex items-center shadow-sm border border-pebble-grey/20 focus-within:ring-2 focus-within:ring-groomr-gold transition-all duration-300">
      <div className="pl-4 text-pebble-grey">
        <SearchIcon size={22}/>
      </div>
      <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)}
             placeholder={placeholder}
             className="flex-grow bg-transparent font-nunito text-lg text-deep-slate placeholder-pebble-grey px-4 py-3 outline-none border-none"/>
      <button type="submit"
              className="btn-primary font-nunito font-bold px-8 py-3 rounded-full text-base whitespace-nowrap focus-ring">
        {ctaLabel}
      </button>
    </div>
  </form>
);

window.SearchPill = SearchPill;
