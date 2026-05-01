// AppointmentCard — used on the dashboard for upcoming + past grooms.

const UpcomingAppointmentCard = ({ appt, onView, onReschedule }) => (
  <div className="bg-white rounded-[12px] p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border border-pebble-grey/20 card-lift">
    <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl p-4 flex flex-col items-center justify-center min-w-[80px] shadow-sm shrink-0">
      <span className="font-nunito font-bold text-sage-leaf uppercase tracking-widest text-xs">{appt.month}</span>
      <span className="font-fredoka text-3xl text-deep-slate">{appt.day}</span>
    </div>
    <div className="flex-grow space-y-2">
      <span className="bg-groomr-gold/20 text-deep-slate text-xs font-bold px-2 py-1 rounded uppercase tracking-wider inline-block">Confirmed</span>
      <h3 className="font-fredoka text-xl text-deep-slate">{appt.service} for {appt.dog}</h3>
      <p className="font-nunito text-deep-slate/80 flex items-center gap-2 text-sm">
        <ClockIcon size={16}/><span>{appt.time}</span>
      </p>
      <p className="font-nunito text-deep-slate/80 flex items-center gap-2 text-sm">
        <PinIcon size={16}/>{appt.groomer} ({appt.distance} miles)
      </p>
    </div>
    <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-pebble-grey/10 mt-4 sm:mt-0">
      <button onClick={onView} className="btn-primary font-nunito font-bold px-6 py-2 rounded-full text-sm focus-ring shadow-sm w-full">View Details</button>
      <button onClick={onReschedule} className="text-sm font-bold text-pebble-grey hover:text-muted-terracotta transition-colors text-center focus-ring rounded">Reschedule / Cancel</button>
    </div>
  </div>
);

const PastAppointmentRow = ({ appt, onRebook }) => (
  <div className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-pebble-grey/10 hover:border-pebble-grey/30 transition-colors">
    <div>
      <p className="font-bold text-deep-slate">{appt.service} <span className="text-pebble-grey font-normal mx-2">|</span> {appt.groomer}</p>
      <p className="text-sm text-deep-slate/70 mt-1">{appt.date} · {appt.dog} · £{appt.price}</p>
    </div>
    <button onClick={onRebook}
      className="bg-transparent border-2 border-sage-leaf text-sage-leaf hover:bg-sage-leaf hover:text-white transition-colors duration-300 font-nunito font-bold px-5 py-1.5 rounded-full text-sm focus-ring">
      Rebook
    </button>
  </div>
);

window.UpcomingAppointmentCard = UpcomingAppointmentCard;
window.PastAppointmentRow = PastAppointmentRow;
