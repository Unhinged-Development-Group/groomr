// GroomerCard — shown in the search results grid. Click opens booking flow.

const GroomerCard = ({ groomer, onView }) => (
  <button onClick={() => onView?.(groomer)}
          className="text-left bg-white rounded-[12px] overflow-hidden border border-pebble-grey/20 card-lift focus-ring block w-full">
    <div className="aspect-[4/3] bg-sage-leaf/20 overflow-hidden">
      <img src={groomer.image} alt={groomer.name} className="w-full h-full object-cover"/>
    </div>
    <div className="p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-fredoka text-xl text-deep-slate leading-tight">{groomer.name}</h3>
          <p className="text-sm text-sage-leaf font-bold mt-1">{groomer.tagline}</p>
        </div>
        <div className="flex items-center gap-1 bg-groomr-gold/20 px-2 py-1 rounded-full shrink-0">
          <StarIcon size={14}/>
          <span className="text-xs font-bold text-deep-slate">{groomer.rating}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-pebble-grey font-bold">
        <PinIcon size={14}/>
        <span>{groomer.distance} miles · {groomer.location}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {groomer.services.slice(0, 3).map(s => (
          <span key={s} className="text-xs font-bold text-deep-slate bg-pebble-grey/10 px-2 py-1 rounded-full border border-pebble-grey/20">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-pebble-grey/10">
        <span className="text-sm text-pebble-grey">From</span>
        <span className="font-fredoka text-xl text-deep-slate">£{groomer.priceFrom}</span>
      </div>
    </div>
  </button>
);

window.GroomerCard = GroomerCard;
