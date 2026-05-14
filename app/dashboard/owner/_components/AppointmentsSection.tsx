"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { Appointment } from "@/app/actions/appointments";
import { cancelAppointment } from "@/app/actions/appointments";
import { Modal } from "@/components/ui/Modal";
import { StarRow } from "@/components/ui/StarRow";

// Helper components mapping from old OwnerDashboard logic
const LABEL_CLASS = "text-xs font-bold text-pebble-grey uppercase tracking-wider";
const INPUT_CLASS = "w-full bg-white border border-pebble-grey/30 rounded-xl px-4 py-3 font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold shadow-sm";

export function AppointmentsSection({ initialAppointments }: { initialAppointments: Appointment[] }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  
  // Modals state
  const [showDetails, setShowDetails] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // Group into upcoming vs past
  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.scheduled_at) > now && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.scheduled_at) <= now || a.status === 'cancelled');

  async function handleCancel() {
    if (!activeAppointment) return;
    
    // Call server action
    const result = await cancelAppointment(activeAppointment.id, "User requested cancellation");
    if (result.ok) {
      setAppointments(prev => prev.map(a => a.id === activeAppointment.id ? { ...a, status: 'cancelled' } : a));
    }
    setShowManage(false);
  }

  return (
    <>
      <section className="mb-10">
        <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate border-b-2 border-pebble-grey/20 pb-3 mb-6">
          Upcoming Appointments
        </h2>

        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-pebble-grey/20 text-center">
            <p className="font-nunito text-pebble-grey">No upcoming appointments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map(apt => {
              const date = new Date(apt.scheduled_at);
              const month = date.toLocaleString('default', { month: 'short' });
              const day = date.getDate();
              const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={apt.id} className="bg-white rounded-[12px] p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border border-pebble-grey/20">
                  <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl p-4 flex flex-col items-center min-w-[80px] shrink-0">
                    <span className="font-nunito font-bold text-sage-leaf uppercase tracking-widest text-xs">
                      {month}
                    </span>
                    <span className="font-fredoka text-3xl text-deep-slate leading-none mt-1">
                      {day}
                    </span>
                  </div>

                  <div className="flex-grow space-y-2">
                    <span className="inline-block bg-groomr-gold/20 text-deep-slate text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                      {apt.status}
                    </span>
                    <h3 className="font-fredoka text-xl text-deep-slate">
                      {apt.service_snapshot_name || "Grooming Service"} for {apt.dogs?.name}
                    </h3>
                    <p className="flex items-center gap-2 font-nunito text-sm text-pebble-grey">
                      <Clock size={14} />
                      {timeString}
                    </p>
                    <p className="flex items-center gap-2 font-nunito text-sm text-pebble-grey">
                      <MapPin size={14} />
                      {apt.groomer_profiles?.business_name || "Groomer"} 
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => {
                        setActiveAppointment(apt);
                        setShowDetails(true);
                      }}
                      className="btn-primary font-nunito font-bold px-6 py-2.5 text-sm focus-ring"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setActiveAppointment(apt);
                        setShowManage(true);
                      }}
                      className="text-sm font-bold text-pebble-grey hover:text-muted-terracotta transition-colors font-nunito text-center focus-ring rounded-full py-1"
                    >
                      Reschedule / Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between border-b-2 border-pebble-grey/20 pb-3 mb-6">
          <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate">
            Previous Grooms
          </h2>
        </div>

        {past.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-pebble-grey/20 text-center">
            <p className="font-nunito text-pebble-grey">No past appointments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {past.slice(0, 5).map(apt => {
              const date = new Date(apt.scheduled_at);
              const dateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const priceDisplay = apt.service_snapshot_price ? `£${(apt.service_snapshot_price / 100).toFixed(2)}` : 'N/A';

              return (
                <div key={apt.id} className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-pebble-grey/20">
                  <div className="space-y-1">
                    <p className="font-bold text-deep-slate font-nunito">
                      {apt.service_snapshot_name || "Service"}
                      <span className="text-pebble-grey font-normal">
                        {" "}| {apt.groomer_profiles?.business_name}
                      </span>
                    </p>
                    <p className="text-sm text-pebble-grey font-nunito">
                      {dateString} · {apt.dogs?.name} · {priceDisplay} · Status: {apt.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Appointment Details Modal */}
      <Modal open={showDetails} onClose={() => setShowDetails(false)}>
        {activeAppointment && (
          <>
            <h2 className="font-fredoka text-3xl text-deep-slate mb-6">
              Appointment Details
            </h2>
            <div className="bg-white rounded-xl p-5 border border-pebble-grey/20 mb-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className={LABEL_CLASS}>Base Service</p>
                  <p className="font-bold text-deep-slate mt-1">{activeAppointment.service_snapshot_name}</p>
                  <p className="text-sm text-pebble-grey font-nunito">For {activeAppointment.dogs?.name}</p>
                </div>
                <div className="text-right">
                  <p className={LABEL_CLASS}>Base Price</p>
                  <p className="font-fredoka text-xl text-deep-slate mt-1">
                    {activeAppointment.service_snapshot_price ? `£${(activeAppointment.service_snapshot_price / 100).toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="border-t border-pebble-grey/20 pt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <p className={LABEL_CLASS}>When</p>
                  <p className="text-sm font-nunito text-deep-slate mt-1">
                    {new Date(activeAppointment.scheduled_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={LABEL_CLASS}>Where</p>
                  <div className="flex items-start gap-1 mt-1">
                    <p className="text-sm font-nunito text-deep-slate">
                      {activeAppointment.groomer_profiles?.business_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowDetails(false)} className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring">
              Close
            </button>
          </>
        )}
      </Modal>

      {/* Manage Appointment Modal */}
      <Modal open={showManage} onClose={() => setShowManage(false)}>
        {activeAppointment && (
          <>
            <h2 className="font-fredoka text-3xl text-deep-slate mb-1">
              Manage Appointment
            </h2>
            <p className="font-bold text-deep-slate font-nunito mb-1">
              {activeAppointment.service_snapshot_name} for {activeAppointment.dogs?.name}
            </p>
            <p className="text-sm text-pebble-grey font-nunito mb-7">
              Scheduled: {new Date(activeAppointment.scheduled_at).toLocaleString()}
            </p>

            {/* Cancel Section */}
            <div className="bg-white p-6 rounded-xl border border-muted-terracotta/30 space-y-4">
              <h3 className="font-fredoka text-xl text-muted-terracotta">
                Cancel Appointment
              </h3>
              <p className="font-bold text-deep-slate font-nunito">Are you sure?</p>
              <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-lg p-3">
                <p className="text-sm font-nunito text-deep-slate">
                  Please review the cancellation policy. Late cancellations may incur a fee.
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="w-full bg-white border-2 border-muted-terracotta text-muted-terracotta hover:bg-muted-terracotta hover:text-white transition-colors font-nunito font-bold px-8 py-3 rounded-full focus-ring"
              >
                Yes, Cancel Appointment
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
