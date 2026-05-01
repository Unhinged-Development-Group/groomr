"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Clock, MapPin } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Dog {
  id: number;
  name: string;
  breed: string;
  age: string;
  sex: string;
}

interface RebookData {
  service: string;
  price: string;
  groomer: string;
  duration: string;
}

interface OwnerDashboardProps {
  firstName: string;
  fullName: string;
  email: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DOG_BREEDS = [
  "Affenpinscher",
  "Afghan Hound",
  "Airedale Terrier",
  "Akita",
  "Alaskan Malamute",
  "Australian Shepherd",
  "Basset Hound",
  "Beagle",
  "Border Collie",
  "Border Terrier",
  "Boston Terrier",
  "Boxer",
  "Bulldog",
  "Cavalier King Charles Spaniel",
  "Chihuahua",
  "Chow Chow",
  "Cocker Spaniel",
  "Dachshund",
  "Dalmatian",
  "French Bulldog",
  "German Shepherd",
  "Golden Retriever",
  "Great Dane",
  "Greyhound",
  "Jack Russell Terrier",
  "Labrador Retriever",
  "Maltese",
  "Miniature Schnauzer",
  "Pomeranian",
  "Poodle",
  "Pug",
  "Rottweiler",
  "Shih Tzu",
  "Siberian Husky",
  "Staffordshire Bull Terrier",
  "West Highland White Terrier",
  "Whippet",
  "Yorkshire Terrier",
  "Mixed Breed / Mutt",
  "Other",
];

const INPUT_CLASS =
  "w-full bg-white border border-pebble-grey/30 rounded-xl px-4 py-3 font-nunito text-deep-slate focus:outline-none focus:ring-2 focus:ring-groomr-gold shadow-sm";

const LABEL_CLASS = "text-xs font-bold text-pebble-grey uppercase tracking-wider";

// ── Star SVG ───────────────────────────────────────────────────────────────

function StarIcon() {
  return (
    <svg
      className="w-4 h-4 text-groomr-gold fill-current"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

// ── Paw SVG ────────────────────────────────────────────────────────────────

function PawIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
      <circle cx="10" cy="11" r="7" fill="#eae45c" opacity="0.55" />
      <path
        stroke="#2c3e50"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 20.5c-3 0-5.5-2-6.5-5-.5-1.5.5-3 2-3h9c1.5 0 2.5 1.5 2 3-1 3-3.5 5-6.5 5z"
      />
      <path
        stroke="#2c3e50"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM15 6a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM21 8a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  );
}

// ── Modal Shell ────────────────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-deep-slate/60 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />
      <div className="relative bg-alabaster-cream w-full max-w-2xl mx-6 max-h-[90vh] overflow-y-auto rounded-[24px] shadow-2xl border border-pebble-grey/20 p-8 md:p-10">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-pebble-grey/10 hover:bg-pebble-grey/20 transition-colors text-deep-slate font-bold text-lg focus-ring"
          aria-label="Close"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Modal A — Appointment Details ──────────────────────────────────────────

function AppointmentDetailsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [extras, setExtras] = useState({ teeth: false, facial: false });
  const total = 45 + (extras.teeth ? 10 : 0) + (extras.facial ? 5 : 0);

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-fredoka text-3xl text-deep-slate mb-6">
        Appointment Details
      </h2>

      {/* Groomer card */}
      <div className="flex items-center gap-4 bg-white rounded-xl p-5 border border-pebble-grey/20 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-pebble-grey/20 shrink-0">
          <Image
            src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=100"
            alt="Sarah's Grooming Room"
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <p className="font-fredoka text-xl text-deep-slate">
            Sarah&apos;s Grooming Room
          </p>
          <p className="text-pebble-grey font-nunito text-sm">
            Head Groomer: Sarah
          </p>
          <div className="flex items-center gap-1 mt-1">
            <StarIcon />
            <span className="text-sm font-nunito text-deep-slate">
              4.9 · 124 reviews
            </span>
          </div>
        </div>
      </div>

      {/* Service summary */}
      <div className="bg-white rounded-xl p-5 border border-pebble-grey/20 mb-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className={LABEL_CLASS}>Base Service</p>
            <p className="font-bold text-deep-slate mt-1">The Standard Groom</p>
            <p className="text-sm text-pebble-grey font-nunito">For Buster</p>
          </div>
          <div className="text-right">
            <p className={LABEL_CLASS}>Base Price</p>
            <p className="font-fredoka text-xl text-deep-slate mt-1">£45.00</p>
          </div>
        </div>

        {(extras.teeth || extras.facial) && (
          <div className="border-t border-pebble-grey/20 pt-3 space-y-2">
            {extras.teeth && (
              <div className="flex justify-between text-sm font-nunito">
                <span className="text-deep-slate">Teeth Cleaning</span>
                <span className="text-deep-slate">+£10.00</span>
              </div>
            )}
            {extras.facial && (
              <div className="flex justify-between text-sm font-nunito">
                <span className="text-deep-slate">Blueberry Facial</span>
                <span className="text-deep-slate">+£5.00</span>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-pebble-grey/20 pt-3 flex justify-between items-center">
          <p className={LABEL_CLASS}>Total</p>
          <p className="font-fredoka text-2xl text-deep-slate">
            £{total.toFixed(2)}
          </p>
        </div>

        <div className="border-t border-pebble-grey/20 pt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <p className={LABEL_CLASS}>When</p>
            <p className="text-sm font-nunito text-deep-slate mt-1">
              Oct 14 2026, 09:30 – 11:30
            </p>
          </div>
          <div>
            <p className={LABEL_CLASS}>Where</p>
            <div className="flex items-start gap-1 mt-1">
              <p className="text-sm font-nunito text-deep-slate">
                Sarah&apos;s Grooming Room, 12 High Street, Dumbarton G82
              </p>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sage-leaf hover:text-deep-slate"
                aria-label="Open in maps"
              >
                <MapPin size={14} className="mt-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Extras */}
      <div className="mb-6">
        <p className="font-fredoka text-xl text-deep-slate mb-3">
          Add Extra Services
        </p>
        <div className="space-y-3">
          <label className="flex items-center justify-between bg-white rounded-xl p-4 border border-pebble-grey/20 cursor-pointer hover:border-sage-leaf/40 transition-colors">
            <div>
              <span className="font-bold text-deep-slate font-nunito">
                Teeth Cleaning
              </span>
              <span className="text-sm text-pebble-grey font-nunito ml-2">
                +£10.00
              </span>
            </div>
            <input
              type="checkbox"
              checked={extras.teeth}
              onChange={(e) =>
                setExtras((prev) => ({ ...prev, teeth: e.target.checked }))
              }
              className="w-5 h-5 accent-sage-leaf rounded"
            />
          </label>
          <label className="flex items-center justify-between bg-white rounded-xl p-4 border border-pebble-grey/20 cursor-pointer hover:border-sage-leaf/40 transition-colors">
            <div>
              <span className="font-bold text-deep-slate font-nunito">
                Blueberry Facial
              </span>
              <span className="text-sm text-pebble-grey font-nunito ml-2">
                +£5.00
              </span>
            </div>
            <input
              type="checkbox"
              checked={extras.facial}
              onChange={(e) =>
                setExtras((prev) => ({ ...prev, facial: e.target.checked }))
              }
              className="w-5 h-5 accent-sage-leaf rounded"
            />
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-8">
        <label className={`${LABEL_CLASS} block mb-2`}>
          Notes for Sarah
        </label>
        <textarea
          rows={3}
          placeholder="Any special instructions..."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <button onClick={onClose} className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring">
        Save Extras &amp; Notes
      </button>
    </Modal>
  );
}

// ── Modal B — Reschedule / Cancel ──────────────────────────────────────────

function ManageAppointmentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-fredoka text-3xl text-deep-slate mb-1">
        Manage Appointment
      </h2>
      <p className="font-bold text-deep-slate font-nunito mb-1">
        The Standard Groom for Buster
      </p>
      <p className="text-sm text-pebble-grey font-nunito mb-7">
        Scheduled: Oct 14, 2026 at 09:30 AM
      </p>

      {/* Reschedule */}
      <div className="bg-white p-6 rounded-xl border border-pebble-grey/20 mb-6 space-y-4">
        <h3 className="font-fredoka text-xl text-deep-slate">
          Reschedule Appointment
        </h3>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>New Date</label>
          <input type="date" className={INPUT_CLASS} />
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>New Time</label>
          <select className={INPUT_CLASS}>
            <option value="10:00">10:00 AM</option>
            <option value="13:30">1:30 PM</option>
          </select>
        </div>
        <button
          onClick={onClose}
          className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring"
        >
          Confirm New Appointment
        </button>
      </div>

      {/* Cancel */}
      <div className="bg-white p-6 rounded-xl border border-muted-terracotta/30 space-y-4">
        <h3 className="font-fredoka text-xl text-muted-terracotta">
          Cancel Appointment
        </h3>
        <p className="font-bold text-deep-slate font-nunito">Are you sure?</p>
        <div className="bg-muted-terracotta/10 border border-muted-terracotta/20 rounded-lg p-3">
          <p className="text-sm font-nunito text-deep-slate">
            Cancellations within 48 hours forfeit your £15.00 deposit per the
            groomer&apos;s policy.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-white border-2 border-muted-terracotta text-muted-terracotta hover:bg-muted-terracotta hover:text-white transition-colors font-nunito font-bold px-8 py-3 rounded-full focus-ring"
        >
          Yes, Cancel Appointment
        </button>
      </div>
    </Modal>
  );
}

// ── Modal C — Rebook ───────────────────────────────────────────────────────

function RebookModal({
  open,
  onClose,
  rebookData,
  dogs,
}: {
  open: boolean;
  onClose: () => void;
  rebookData: RebookData | null;
  dogs: Dog[];
}) {
  if (!rebookData) return null;
  const priceNum = parseFloat(rebookData.price);
  const deposit = (priceNum * 0.33).toFixed(2);
  const remaining = (priceNum - priceNum * 0.33).toFixed(2);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center mb-7">
        <h2 className="font-fredoka text-3xl text-deep-slate mb-1">
          Rebook Appointment
        </h2>
        <p className="text-pebble-grey font-nunito">{rebookData.groomer}</p>
      </div>

      {/* Service recap */}
      <div className="bg-white p-5 rounded-xl border border-pebble-grey/20 mb-6 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-deep-slate font-nunito">
              {rebookData.service}
            </p>
            <p className="text-sm text-pebble-grey font-nunito">
              {rebookData.duration}
            </p>
          </div>
          <p className="font-fredoka text-xl text-deep-slate">
            £{rebookData.price}
          </p>
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>
            Who is this for?
          </label>
          <select className={INPUT_CLASS}>
            {dogs.length > 0 ? (
              dogs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))
            ) : (
              <option value="buster">Buster</option>
            )}
          </select>
        </div>
      </div>

      {/* Date / time */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Date</label>
          <input type="date" className={INPUT_CLASS} />
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Time</label>
          <select className={INPUT_CLASS}>
            <option value="09:00">09:00 AM</option>
            <option value="11:30">11:30 AM</option>
            <option value="14:00">2:00 PM</option>
          </select>
        </div>
      </div>

      {/* Payment summary */}
      <div className="bg-sage-leaf/10 p-5 rounded-xl mb-8 space-y-2">
        <div className="flex justify-between font-nunito text-deep-slate">
          <span>Service total</span>
          <span className="font-bold">£{rebookData.price}</span>
        </div>
        <div className="flex justify-between font-nunito text-deep-slate">
          <span>Deposit required (33%)</span>
          <span className="font-bold">£{deposit}</span>
        </div>
        <div className="border-t border-sage-leaf/20 pt-2 text-sm text-pebble-grey font-nunito">
          Remaining £{remaining} paid on the day
        </div>
      </div>

      <button
        onClick={onClose}
        className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring"
      >
        Confirm &amp; Pay Deposit
      </button>
    </Modal>
  );
}

// ── Modal D — Add Dog ──────────────────────────────────────────────────────

function AddDogModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (dog: Dog) => void;
}) {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [neutered, setNeutered] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState("");

  function handleSubmit() {
    if (!name.trim()) return;
    onSave({
      id: Date.now(),
      name: name.trim(),
      breed: breed || "Unknown",
      age,
      sex,
    });
    setName("");
    setBreed("");
    setAge("");
    setSex("");
    setDob("");
    setNeutered(false);
    setMedicalNotes("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-fredoka text-3xl text-deep-slate mb-7">
        Add a New Dog
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Dog&apos;s Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Buster"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Breed</label>
          <select
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select breed</option>
            {DOG_BREEDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Age</label>
          <input
            type="text"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 3 years"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neutered}
              onChange={(e) => setNeutered(e.target.checked)}
              className="w-5 h-5 accent-sage-leaf rounded"
            />
            <span className="font-nunito font-bold text-deep-slate text-sm">
              Neutered / Spayed
            </span>
          </label>
        </div>
        <div className="col-span-2">
          <label className={`${LABEL_CLASS} block mb-2`}>
            Photo (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full font-nunito text-sm text-pebble-grey file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-bold file:bg-sage-leaf/10 file:text-deep-slate hover:file:bg-sage-leaf/20 transition-colors"
          />
        </div>
        <div className="col-span-2">
          <label className={`${LABEL_CLASS} block mb-2`}>
            Medical Notes
          </label>
          <textarea
            rows={3}
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Any allergies, health conditions, or special requirements..."
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring mt-2"
      >
        Save Dog Profile
      </button>
    </Modal>
  );
}

// ── Modal E — Edit Dog ─────────────────────────────────────────────────────

function EditDogModal({
  open,
  onClose,
  dog,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  dog: Dog | null;
  onSave: (updated: Dog) => void;
}) {
  const [name, setName] = useState(dog?.name ?? "");
  const [breed, setBreed] = useState(dog?.breed ?? "");
  const [age, setAge] = useState(dog?.age ?? "");
  const [sex, setSex] = useState(dog?.sex ?? "");
  const [neutered, setNeutered] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState("");

  // Sync fields when the dog prop changes (new dog selected for editing)
  useEffect(() => {
    if (dog) {
      setName(dog.name);
      setBreed(dog.breed);
      setAge(dog.age);
      setSex(dog.sex);
    }
  }, [dog]);

  function handleSubmit() {
    if (!dog || !name.trim()) return;
    onSave({ ...dog, name: name.trim(), breed, age, sex });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="font-fredoka text-3xl text-deep-slate mb-7">
        Edit Dog Info
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Dog&apos;s Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Breed</label>
          <select
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select breed</option>
            {DOG_BREEDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Age</label>
          <input
            type="text"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={`${LABEL_CLASS} block mb-2`}>Sex</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={neutered}
              onChange={(e) => setNeutered(e.target.checked)}
              className="w-5 h-5 accent-sage-leaf rounded"
            />
            <span className="font-nunito font-bold text-deep-slate text-sm">
              Neutered / Spayed
            </span>
          </label>
        </div>
        <div className="col-span-2">
          <label className={`${LABEL_CLASS} block mb-2`}>
            Medical Notes
          </label>
          <textarea
            rows={3}
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Any allergies, health conditions, or special requirements..."
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="btn-primary font-nunito font-bold px-8 py-3 w-full focus-ring mt-2"
      >
        Save Changes
      </button>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function OwnerDashboard({ firstName, fullName, email }: OwnerDashboardProps) {
  // Appointment modals
  const [showDetails, setShowDetails] = useState(false);
  const [showManage, setShowManage] = useState(false);

  // Rebook modal
  const [showRebook, setShowRebook] = useState(false);
  const [rebookData, setRebookData] = useState<RebookData | null>(null);

  // Dog modals
  const [showAddDog, setShowAddDog] = useState(false);
  const [showEditDog, setShowEditDog] = useState(false);
  const [editingDog, setEditingDog] = useState<Dog | null>(null);

  // Dogs state
  const [dogs, setDogs] = useState<Dog[]>([]);

  function handleAddDog(dog: Dog) {
    setDogs((prev) => [...prev, dog]);
  }

  function handleEditDog(updated: Dog) {
    setDogs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  return (
    <div className="page-fade w-full px-6 lg:px-12 xl:px-20 pt-12 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 xl:gap-16">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-12">

          {/* 1. Welcome + Search */}
          <div className="space-y-6">
            <div>
              <h1 className="font-fredoka text-4xl md:text-5xl text-deep-slate">
                Welcome back, {firstName}.
              </h1>
              <p className="font-nunito text-lg text-deep-slate/80 mt-2">
                Here is what&apos;s happening with your dogs.
              </p>
            </div>

            {/* Search bar */}
            <div className="flex items-center bg-white rounded-full border border-pebble-grey/20 shadow-sm px-4 py-2 gap-3">
              <Search size={18} className="text-pebble-grey shrink-0" />
              <input
                type="text"
                placeholder="Search for a groomer or service..."
                className="flex-1 bg-transparent font-nunito text-deep-slate placeholder:text-pebble-grey focus:outline-none text-base"
              />
              <Link
                href="/search"
                className="btn-primary font-nunito font-bold px-5 py-2 text-sm shrink-0 focus-ring"
              >
                Search
              </Link>
            </div>
          </div>

          {/* 2. Upcoming Appointments */}
          <section>
            <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate border-b-2 border-pebble-grey/20 pb-3 mb-6">
              Upcoming Appointments
            </h2>

            <div className="bg-white rounded-[12px] p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border border-pebble-grey/20">
              {/* Date badge */}
              <div className="bg-sage-leaf/10 border border-sage-leaf/20 rounded-xl p-4 flex flex-col items-center min-w-[80px] shrink-0">
                <span className="font-nunito font-bold text-sage-leaf uppercase tracking-widest text-xs">
                  Oct
                </span>
                <span className="font-fredoka text-3xl text-deep-slate leading-none mt-1">
                  14
                </span>
              </div>

              {/* Details */}
              <div className="flex-grow space-y-2">
                <span className="inline-block bg-groomr-gold/20 text-deep-slate text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                  Confirmed
                </span>
                <h3 className="font-fredoka text-xl text-deep-slate">
                  The Standard Groom for Buster
                </h3>
                <p className="flex items-center gap-2 font-nunito text-sm text-pebble-grey">
                  <Clock size={14} />
                  09:30 AM – 11:30 AM
                </p>
                <p className="flex items-center gap-2 font-nunito text-sm text-pebble-grey">
                  <MapPin size={14} />
                  Sarah&apos;s Grooming Room (1.2 miles)
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setShowDetails(true)}
                  className="btn-primary font-nunito font-bold px-6 py-2.5 text-sm focus-ring"
                >
                  View Details
                </button>
                <button
                  onClick={() => setShowManage(true)}
                  className="text-sm font-bold text-pebble-grey hover:text-muted-terracotta transition-colors font-nunito text-center focus-ring rounded-full py-1"
                >
                  Reschedule / Cancel
                </button>
              </div>
            </div>
          </section>

          {/* 3. Previous Grooms */}
          <section>
            <div className="flex items-center justify-between border-b-2 border-pebble-grey/20 pb-3 mb-6">
              <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate">
                Previous Grooms
              </h2>
              <Link
                href="/grooms"
                className="text-sm font-bold text-sage-leaf hover:text-deep-slate transition-colors font-nunito focus-ring rounded-full px-2 py-1"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {/* Row 1 */}
              <div className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-pebble-grey/20">
                <div className="space-y-1">
                  <p className="font-bold text-deep-slate font-nunito">
                    The Puppy Trim{" "}
                    <span className="text-pebble-grey font-normal">
                      | Sarah&apos;s Grooming Room
                    </span>
                  </p>
                  <p className="text-sm text-pebble-grey font-nunito">
                    12 Aug 2026 · Buster · £45.00
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRebookData({
                      service: "The Puppy Trim",
                      price: "45.00",
                      groomer: "Sarah's Grooming Room",
                      duration: "Approx. 1.5 hours",
                    });
                    setShowRebook(true);
                  }}
                  className="bg-transparent border-2 border-sage-leaf text-sage-leaf hover:bg-sage-leaf hover:text-white transition-colors font-nunito font-bold px-5 py-1.5 rounded-full text-sm focus-ring shrink-0"
                >
                  Rebook
                </button>
              </div>

              {/* Row 2 */}
              <div className="bg-white rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-pebble-grey/20">
                <div className="space-y-1">
                  <p className="font-bold text-deep-slate font-nunito">
                    Full Wash &amp; De-shed{" "}
                    <span className="text-pebble-grey font-normal">
                      | The Posh Paws
                    </span>
                  </p>
                  <p className="text-sm text-pebble-grey font-nunito">
                    05 Jun 2026 · Buster · £55.00
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRebookData({
                      service: "Full Wash & De-shed",
                      price: "55.00",
                      groomer: "The Posh Paws",
                      duration: "Approx. 2 hours",
                    });
                    setShowRebook(true);
                  }}
                  className="bg-transparent border-2 border-sage-leaf text-sage-leaf hover:bg-sage-leaf hover:text-white transition-colors font-nunito font-bold px-5 py-1.5 rounded-full text-sm focus-ring shrink-0"
                >
                  Rebook
                </button>
              </div>
            </div>
          </section>

          {/* 4. Your Favourites */}
          <section>
            <h2 className="font-fredoka text-2xl md:text-3xl text-deep-slate border-b-2 border-pebble-grey/20 pb-3 mb-6">
              Your Favourites
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Favourite 1 */}
              <div className="bg-white rounded-[12px] p-5 border border-pebble-grey/20 card-lift flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-pebble-grey/20 shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=100"
                    alt="Sarah's Grooming Room"
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-bold text-deep-slate font-nunito">
                    Sarah&apos;s Grooming Room
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <StarIcon />
                    <span className="text-sm font-nunito text-deep-slate">
                      4.9 (124)
                    </span>
                  </div>
                </div>
              </div>

              {/* Favourite 2 */}
              <div className="bg-white rounded-[12px] p-5 border border-pebble-grey/20 card-lift flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-pebble-grey/20 shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=100"
                    alt="The Posh Paws"
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <p className="font-bold text-deep-slate font-nunito">
                    The Posh Paws
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <StarIcon />
                    <span className="text-sm font-nunito text-deep-slate">
                      4.8 (89)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="space-y-10">

          {/* 5. My Dogs */}
          <div className="bg-sage-leaf/10 p-8 rounded-[16px] border border-sage-leaf/20 space-y-6">
            <div className="flex items-center gap-3 border-b border-sage-leaf/30 pb-3">
              <PawIcon />
              <h2 className="font-fredoka text-2xl text-deep-slate">
                My Dogs
              </h2>
            </div>

            {dogs.length > 0 && (
              <div className="space-y-3">
                {dogs.map((dog) => (
                  <div
                    key={dog.id}
                    className="bg-white rounded-xl p-4 flex items-center gap-3 border border-pebble-grey/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-sage-leaf text-white font-fredoka flex items-center justify-center text-lg shrink-0">
                      {dog.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-deep-slate truncate">
                        {dog.name}
                      </p>
                      <p className="text-xs text-pebble-grey">{dog.breed}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingDog(dog);
                        setShowEditDog(true);
                      }}
                      className="text-xs font-bold text-sage-leaf hover:text-deep-slate transition-colors ml-auto shrink-0 focus-ring rounded px-1"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowAddDog(true)}
              className="w-full bg-white border-2 border-dashed border-pebble-grey/40 text-deep-slate hover:border-sage-leaf hover:bg-sage-leaf/5 transition-all font-nunito font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 focus-ring"
            >
              <span className="text-xl leading-none">+</span>
              Add a Dog
            </button>
          </div>

          {/* 6. My Details */}
          <div className="bg-white p-8 rounded-[16px] border border-pebble-grey/20 space-y-6">
            <h2 className="font-fredoka text-2xl text-deep-slate border-b border-pebble-grey/20 pb-3">
              My Details
            </h2>

            <div className="space-y-4">
              <div>
                <p className={LABEL_CLASS}>Name</p>
                <p className="text-deep-slate font-bold mt-1">{fullName}</p>
              </div>
              <div>
                <p className={LABEL_CLASS}>Email</p>
                <p className="text-deep-slate font-bold mt-1 break-all">
                  {email}
                </p>
              </div>
            </div>

            <button className="btn-secondary font-nunito font-bold px-6 py-3 w-full focus-ring">
              Update Details
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AppointmentDetailsModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
      <ManageAppointmentModal
        open={showManage}
        onClose={() => setShowManage(false)}
      />
      <RebookModal
        open={showRebook}
        onClose={() => setShowRebook(false)}
        rebookData={rebookData}
        dogs={dogs}
      />
      <AddDogModal
        open={showAddDog}
        onClose={() => setShowAddDog(false)}
        onSave={handleAddDog}
      />
      <EditDogModal
        open={showEditDog}
        onClose={() => setShowEditDog(false)}
        dog={editingDog}
        onSave={handleEditDog}
      />
    </div>
  );
}
