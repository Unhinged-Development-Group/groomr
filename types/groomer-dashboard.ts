export interface ProfileFormData {
  businessName: string;
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

export interface AvailabilityRow {
  dayOfWeek: number;   // 0=Sun, 1=Mon … 6=Sat
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  isActive: boolean;
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

export interface ProfileEditorInitialData {
  groomerProfileId: string;
  profile: ProfileFormData;
  coverPhotoUrl: string | null;
  services: ServiceRow[];
  availability: AvailabilityRow[];
  team: TeamMemberRow[];
  viewerRole: "owner" | "team_member";
  /** Set when viewerRole === 'team_member' */
  teamMemberId: string | null;
}
