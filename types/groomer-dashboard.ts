export interface ProfileFormData {
  businessName: string;
  tagline: string;
  ownerName: string;       // profiles.full_name — read-only in the form
  email: string;
  phone: string;
  bio: string;
  businessMode: "mobile" | "studio";
  radius: number;          // travel_radius_miles
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  depositType: "none" | "percentage" | "full";
  depositPercentage: number;
  bufferMinutes: number;
  isAcceptingBookings: boolean;
}

export interface ServiceRow {
  id: string | null;   // null = not yet persisted
  name: string;
  duration: number;    // minutes
  price: number;       // pence
  sortOrder: number;
}

export interface BreakSlot {
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
}

export interface AvailabilityRow {
  dayOfWeek: number;   // 0=Sun, 1=Mon … 6=Sat
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  isActive: boolean;
  breaks: BreakSlot[];
}

export interface TeamMemberRow {
  id: string;
  name: string;
  role: string;
  sinceYear: string;
  email: string | null;
  userId: string | null;
  inviteStatus: "pending" | "accepted" | "revoked";
  averageRating: number;
  totalReviews: number;
  publicSlug: string | null;
}

export type VerificationDocType =
  | "insurance"
  | "qualification"
  | "firstAid"
  | "photoId"
  | "employersLiability";

export interface VerificationDocs {
  insuranceDocUrl: string | null;
  qualificationDocUrl: string | null;
  firstAidDocUrl: string | null;
  photoIdDocUrl: string | null;
  employersLiabilityDocUrl: string | null;
  hasEmployees: boolean | null;
  insuranceVerified: boolean;
  qualificationVerified: boolean;
  firstAidVerified: boolean;
  photoIdVerified: boolean;
  employersLiabilityVerified: boolean;
}

export interface ProfileEditorInitialData {
  groomerProfileId: string;
  publicSlug: string | null;
  profile: ProfileFormData;
  coverPhotoUrl: string | null;
  profileImageUrl: string | null;
  services: ServiceRow[];
  availability: AvailabilityRow[];
  team: TeamMemberRow[];
  viewerRole: "owner" | "team_member";
  /** Set when viewerRole === 'team_member' */
  teamMemberId: string | null;
  averageRating: number | null;
  totalReviews: number | null;
  verificationDocs: VerificationDocs;
  portfolioCount: number;
  contractTerms: { id: string; version: number; content: string } | null;
  /** Founding-groomer status badge (no fee implications — see sign-up incentive) */
  isFoundingGroomer: boolean;
  /** Sign-up incentive: completed bookings consumed so far (0% commission while under the limit) */
  incentiveBookingsUsed: number;
  /** Sign-up incentive allowance from platform_settings (default 150) */
  incentiveBookingsLimit: number;
}
