// Modal shell + login form + booking flow.

const Modal = ({ open, onClose, children, size = "md" }) => {
  if (!open) return null;
  const w = size === "lg" ? "max-w-2xl" : size === "xl" ? "max-w-4xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog">
      <div onClick={onClose} className="absolute inset-0 bg-deep-slate/60 backdrop-blur-sm cursor-pointer"/>
      <div className={`relative bg-alabaster-cream w-full ${w} mx-6 rounded-[24px] p-8 md:p-10 shadow-2xl z-10 border border-pebble-grey/20 max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose}
          className="absolute top-5 right-5 text-pebble-grey hover:text-muted-terracotta transition-colors focus-ring rounded-full p-1 bg-white shadow-sm border border-pebble-grey/10">
          <CloseIcon size={20}/>
        </button>
        {children}
      </div>
    </div>
  );
};

const LoginModal = ({ open, onClose, onSubmit }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center mb-8">
        <h2 className="font-fredoka text-3xl text-deep-slate">Welcome back</h2>
        <p className="font-nunito text-deep-slate/70 mt-2">Log in to manage your appointments.</p>
      </div>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); onSubmit?.({ email, password }); }}>
        <div className="space-y-1.5 text-left">
          <label className="font-nunito font-bold text-sm text-deep-slate ml-1">Email Address</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required
            className="w-full bg-white border border-pebble-grey/30 rounded-xl px-4 py-3 font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold transition-shadow placeholder-pebble-grey/60 shadow-sm"/>
        </div>
        <div className="space-y-1.5 text-left">
          <label className="font-nunito font-bold text-sm text-deep-slate ml-1">Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
            className="w-full bg-white border border-pebble-grey/30 rounded-xl px-4 py-3 font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold transition-shadow placeholder-pebble-grey/60 shadow-sm"/>
        </div>
        <button type="submit" className="w-full btn-primary font-nunito font-bold px-8 py-3.5 rounded-full text-base focus-ring shadow-sm">Log In</button>
        <div className="text-center">
          <a href="#" className="font-nunito font-bold text-sm text-sage-leaf hover:text-muted-terracotta transition-colors">Forgotten Password?</a>
        </div>
      </form>
    </Modal>
  );
};

const BookingModal = ({ open, onClose, groomer, onConfirm }) => {
  const [service, setService] = React.useState(0);
  const [date, setDate] = React.useState(2);
  if (!groomer) return null;
  const days = ["Mon 10","Tue 11","Wed 12","Thu 13","Fri 14","Sat 15"];
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-sage-leaf uppercase tracking-widest mb-2">Booking</p>
          <h2 className="font-fredoka text-3xl text-deep-slate">{groomer.name}</h2>
          <p className="text-sm text-deep-slate/70 mt-1">{groomer.location} · {groomer.distance} miles away</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-nunito font-extrabold text-deep-slate">Choose a service</h4>
          <div className="space-y-2">
            {groomer.servicesDetail.map((s, i) => (
              <button key={s.name} onClick={() => setService(i)}
                className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all text-left ${service === i ? "border-groomr-gold bg-groomr-gold/10" : "border-pebble-grey/20 bg-white hover:border-pebble-grey/40"}`}>
                <div>
                  <p className="font-bold text-deep-slate">{s.name}</p>
                  <p className="text-xs text-pebble-grey">{s.duration}</p>
                </div>
                <span className="font-fredoka text-lg text-deep-slate">£{s.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-nunito font-extrabold text-deep-slate">Pick a date</h4>
          <div className="grid grid-cols-6 gap-2">
            {days.map((d, i) => (
              <button key={d} onClick={() => setDate(i)}
                className={`p-3 rounded-xl border-2 transition-all text-center ${date === i ? "border-groomr-gold bg-groomr-gold/10" : "border-pebble-grey/20 bg-white hover:border-pebble-grey/40"}`}>
                <span className="font-bold text-xs text-deep-slate">{d}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-pebble-grey/20">
          <div>
            <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">Total</p>
            <p className="font-fredoka text-2xl text-deep-slate">£{groomer.servicesDetail[service].price}</p>
          </div>
          <button onClick={() => onConfirm?.({ groomer, service: groomer.servicesDetail[service], date: days[date] })}
            className="btn-primary font-nunito font-bold px-8 py-3 rounded-full text-base focus-ring shadow-sm">
            Confirm Booking
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ConfirmationModal = ({ open, onClose, booking }) => {
  if (!booking) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center space-y-5">
        <div className="w-16 h-16 mx-auto bg-groomr-gold/30 rounded-full flex items-center justify-center text-deep-slate">
          <CheckIcon size={32}/>
        </div>
        <h2 className="font-fredoka text-3xl text-deep-slate">You're booked.</h2>
        <p className="text-deep-slate/80 leading-relaxed">
          {booking.service.name} with <strong>{booking.groomer.name}</strong> on <strong>{booking.date}</strong>. We've sent a confirmation to your inbox.
        </p>
        <button onClick={onClose} className="w-full btn-primary font-nunito font-bold px-8 py-3 rounded-full focus-ring">Done</button>
      </div>
    </Modal>
  );
};

window.Modal = Modal;
window.LoginModal = LoginModal;
window.BookingModal = BookingModal;
window.ConfirmationModal = ConfirmationModal;
