// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  inviteCode: string;
  password: string;
  dateOfBirth: string; // yyyy-MM-dd
  gender: string; // MALE | FEMALE | OTHER
  aadharNumber?: string;
  flatNo?: string;
  block?: string;
}

export interface AuthResponse {
  userId: string;
  message: string;
  token: string;
  refreshToken?: string;
  fullName?: string;
  email?: string;
  role?: string;
  communityId?: number;
  dateOfBirth?: string;
  enabledModules?: string[];
}

export type GovtIdType = "AADHAAR" | "VOTER_ID" | "DRIVING_LICENCE";

export interface KycRequest {
  govtIdType: GovtIdType;
  govtIdNumber: string;
  docType: string;
  s3Key: string;
  s3KeyBack?: string;
  addressOnDocument?: string;
  dobOnDocument?: string;
  nameOnDocument?: string;
  consentGiven: boolean;
}

// ─── Sports ──────────────────────────────────────────────────────────────────

export interface SportMeta {
  id: number;
  name: string;
  iconUrl?: string;
  icon?: string;
  communityId?: number;
  community?: CommunityResponse;
  active: boolean;
  minAge?: number;
  maxAge?: number;
  minPlayers?: number;
  maxPlayers?: number;
  gender?: string;
  playersBorn?: string;
  formats?: MatchFormat[];
  tournamentType?: string;
}

export interface PlayerCategory {
  id: number;
  name: string;
  categoryType: string;       // MENS, WOMENS, BOYS, GIRLS, KIDS, SENIORS
  description?: string;
  minAge: number;
  maxAge: number;
  gender: string;          // MALE, FEMALE, ALL
  type?: string;           // DEFAULT, USER, VENDOR
  communityId?: number;
}

export interface CommunityResponse {
  id: number;
  name: string;
  code?: string;
  type: string;
  inviteCode?: string;
  city?: string;
  state?: string;
  area?: string;
  subtype?: string;
  active?: boolean;
  enabledModules?: string[];
}

export interface Community extends CommunityResponse { }

export interface AppUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  kycStatus: string;
  community?: Community;
}

export type EventStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED";

export type MatchFormat = "SINGLES" | "DOUBLES" | "MIXED_DOUBLES" | "TEAM";
export type TournamentType = "KNOCKOUT" | "ROUND_ROBIN" | "LEAGUE" | "KNOCKOUT_SINGLE" | "KNOCKOUT_DOUBLE" | "GROUP_PLAYOFF" | "CUSTOM";

export interface Court {
  id?: string;
  name: string;
  color: string;
  openingTime?: string;
  closingTime?: string;
}

export interface EventContact {
  id?: number;
  name: string;
  title?: string;
  number: string;
  email: string;
}

export interface Venue {
  id: number;
  name: string;
  address?: string;
  city?: string;
  area?: string;
  mapLink?: string;
  capacity?: number;
  venueType?: string;
  venueCategory?: string;
  openingTime?: string;
  closingTime?: string;
  courts?: Court[];
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactTitle?: string;
  contactId?: number;
  contacts?: EventContact[];
  pinCode?: string;
  communityId?: number;
  communityName?: string;
}

export interface Sponsor {
  id?: number;
  category: string;
  name: string;
  url?: string;
}

export interface SportsEvent {
  id: number;
  /** Public, non-sequential id used in shareable registration links. */
  uuid?: string;
  name: string;
  sport?: SportMeta;
  community?: Community;
  eventDateStart: string; // LocalDate → string
  eventDateEnd: string;
  venue?: Venue;
  maxParticipants?: number;
  registrationStatus?: EventStatus;
  tournament?: any;
  format?: MatchFormat;
  tournamentType?: TournamentType;
  categories?: PlayerCategory[];
  sponsors?: Sponsor[];
  createdBy?: AppUser;
  createdAt?: string;
  updatedAt?: string;
  auctionStatus?: string;
  auctionEnabled?: boolean;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactId?: number;
  contactTitle?: string;
  contacts?: EventContact[];
  otherContacts?: { title: string; name: string; detail: string; }[];
  bannerImage?: string;
  tournamentLevel?: "Standard" | "Professional" | "Premium";
  description?: string;
  allowAdminChat?: boolean;
  startTime?: string;
  dueTime?: string;
  minPlayers?: number;
  maxPlayers?: number;
  gender?: string;
  playersBorn?: string;
  disputeCommitteeIds?: string;
  status?: string;
  /** When true, self-registrations require organiser confirmation (land PENDING). */
  adminApprovalRequired?: boolean;
}

export interface SportsEventRequest {
  name: string;
  sportId: number;
  communityId: number;
  eventDateStart: string;
  eventDateEnd: string;
  venueId?: number;
  maxParticipants?: number;
  format?: string;
  tournamentType?: string;
  categoryIds?: number[];
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  otherContacts?: { title: string; name: string; detail: string; }[];
  auctionEnabled?: boolean;
  bannerImage?: string;
  tournamentLevel?: "Standard" | "Professional" | "Premium";
  description?: string;
  allowAdminChat?: boolean;
  startTime?: string;
  dueTime?: string;
  minPlayers?: number;
  maxPlayers?: number;
  gender?: string;
  playersBorn?: string;
  sponsors?: Sponsor[];
  minAge?: number;
  maxAge?: number;
  notifications?: NotificationScheduleRequest[];
  eventId?: number;
  sportsEventIds?: number[];
  adminApprovalRequired?: boolean;
  tournamentId?: number;
}

export interface NotificationScheduleRequest {
  id?: string;
  label?: string;
  offset: number;
  enabled: boolean;
  title: string;
  body: string;
  recipients?: string[];
  overrideChannels?: string[];
  priority?: string;
  isCustom?: boolean;
}

export interface RegistrationRequest {
  eventId: number;
  categoryId: number;
  matchType: string;
  role?: string;
  age?: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  avgScore?: number;
  partnerUserId?: number;
  playerName?: string;
  email?: string;
  relation?: string;
  flatNumber?: string;
  /** Google reCAPTCHA token (only verified when the backend feature is enabled). */
  recaptchaToken?: string;
}

export interface EventRegistration {
  id: number;
  event?: SportsEvent;
  user?: AppUser;
  category?: PlayerCategory;
  status: "PENDING" | "REGISTERED" | "CONFIRMED" | "WITHDRAWN" | "REJECTED";
  playerName?: string;
  email?: string;
  relation?: string;
  flatNumber?: string;
  age?: number;
  role?: string;
  /** Optional skill rating used for balanced knockout pairing (Rule 6). */
  rating?: number | null;
  captainNomination?: boolean;
  captainConfirmation?: boolean;
  proposedTeamName?: string;
  registeredAt?: string;
}

export interface SportsTournament {
  id: number;
  name: string;
  event?: SportsEvent;
  format?: string;
  tournamentType?: string;
  createdAt?: string;
  updatedAt?: string;
  communityId?: number;
  contactId?: number;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactTitle?: string;
  contacts?: EventContact[];
  sportsEvents?: SportsEvent[];
}

export type SportsTournamentRequest = SportsEventRequest;
export type TournamentRegistration = EventRegistration;
export type SportsEventRegistration = EventRegistration;

// ─── Auction ─────────────────────────────────────────────────────────────────

export type PlayerStatus = "UNSOLD" | "SOLD" | "RETAINED" | "QUEUE" | "active" | "next" | "queue" | "SELLING" | "PASSED" | "QUEUED";

export interface AuctionPlayer {
  id: number;
  name: string; // mapped from playerName
  initials?: string;
  role?: string; // mapped from playerRole
  category?: string;
  age?: number;
  basePrice?: number;
  statsJson?: string;
  matches?: number;
  runs?: number;
  avgScore?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  status: PlayerStatus;
  assignedTeam?: AuctionTeam;
  soldPrice?: number;
  queueOrder?: number;
}

export interface AuctionTeam {
  id: number;
  teamName: string;
  name?: string;
  ownerName?: string;
  ownerUser?: AppUser;
  captainUser?: AppUser;
  colorHex?: string;
  color?: string;
  emoji?: string;
  totalBudget: number;
  budget: number;
  remainingBudget: number;
  spent: number;
  captainNomination: boolean;
  captainConfirmation: boolean;
  eventId: number;
  configId?: number;
  players?: Array<{ name: string; soldPrice: number; category?: string }>;
}

export interface BidRequest {
  configId: number;
  playerId: number;
  teamId: number;
  bidAmount: number;
  isRtm?: boolean;
}

export interface AuctionBid {
  id: number;
  amount: number; // mapped from bidAmount
  player?: AuctionPlayer;
  team?: AuctionTeam;
  createdAt?: string; // mapped from bidAt
}

export interface AuctionTeamSummary {
  teamId: number;
  teamName: string;
  playerCount: number;
  totalSpent: number;
  remainingBudget: number;
}

export interface PlayerWithBidResponse {
  playerId: number;
  playerName: string;
  category: string;
  playerRole: string;
  age: number;
  basePrice: number;
  statsJson: string;
  currentBid: number;
  nextBid: number;
  nextIncrement: number;
  currentBidTeamName: string;
  queueOrder: number;
  status: string;
}

export interface AuctionStatsResponse {
  totalPlayers: number;
  soldPlayers: number;
  queuedPlayers: number;
  totalTeams: number;
  totalBudget: number;
  totalSpent: number;
}

export interface SoldPlayerRequest {
  playerId: number;
  teamId: number;
}

export interface AuctionPlayerRequest {
  playerName: string;
  category: string;
  playerRole?: string;
  age?: number;
  basePrice: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  strikeRate?: number;
  economy?: number;
  avgScore?: number;
}

export interface AuctionTeamRequest {
  configId: number;
  teamName: string;
  ownerName: string;
  ownerUserId?: number;
  colorHex?: string;
  totalBudget: number;
}

export interface AuctionConfigRequest {
  sportId: number;
  eventId?: number;
  seasonName: string;
  auctionFormat: string;
  totalTeams: number;
  totalPlayers: number;
  budgetPerTeam: number;
  basePrice: number;
  bidIncrementDefault: number;
  bidIncrementThreshold: number;
  bidIncrementAbove: number;
  bidTimerSeconds: number;
  rtmEnabled?: boolean;
  unsoldRule?: string;
  categories?: string[];
  committeeMembers?: string[];
}

export interface AuctionConfigResponse {
  id: number;
  sportId?: number;
  communityId?: number;
  eventId?: number;
  eventName?: string;
  sportName: string;
  seasonName: string;
  auctionFormat: string;
  totalTeams: number;
  totalPlayers: number;
  budgetPerTeam: number;
  basePrice: number;
  bidIncrementDefault: number;
  bidIncrementThreshold: number;
  bidIncrementAbove: number;
  bidTimerSeconds: number;
  rtmEnabled: boolean;
  unsoldRule: string;
  status: string;
  categories: string[];
  committeeMembers: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  kycStatus: string;
  profilePicUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  flatNo?: string;
  block?: string;
  communityId?: number;
  roleId?: number;
  isActive?: boolean;
  permissions?: string[];
  enabledModules?: string[];
}

export type RolePermissionsMap = Record<string, string[]>;

export interface RoleResponse {
  id: number;
  name: string;
  permissions?: Array<{
    id: number;
    role: string;
    permissionKey: string;
  }>;
}

export interface SportFormEvent {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  gender: string;
  playersBorn: string;
  format: string;
  formats: string[];
  minPlayers: string;
  maxPlayers: string;
  minAge: string;
  maxAge: string;
  tournamentType: string;
  venueId?: string | number;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  contacts?: EventContact[];
  otherContacts?: { title: string; name: string; detail: string; }[];
  auctionEnabled?: boolean;
  adminApprovalRequired?: boolean;
}

export interface SportFormEntry {
  id: string;
  name: string;
  icon: string;
  iconUrl?: string;
  sportId: number;
  editingSportId: number | null;
  events: SportFormEvent[];
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface RegistrationOpenNotificationRequest {
  sendEmail: boolean;
  sendPush: boolean;
  sendSms: boolean;
  message?: string;
}

export interface TournamentAnnouncementRequest {
  template: string;
  subject: string;
  message: string;
  sendEmail: boolean;
  sendPush: boolean;
  customHtml?: string | null;
}

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserStats {
  posts: number;
  connections: number;
  eventsAttended: number;
  itemsSold: number;
  jobsPosted: number;
  sportsPlayed: number;
}

export interface UserProfileResponse {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  dob?: string; // yyyy-MM-dd
  gender?: string;
  flatNo?: string;
  block?: string;
  role: string;
  kycStatus: string;
  communityName?: string;
  communityType?: string;
  communityCode?: string;
  joinedAt?: string; // yyyy-MM-dd
  bio?: string;
  profilePicUrl?: string;
  coverPicUrl?: string;
  skills: string[];
  stats: UserStats;
  /** Earned achievement badges. Optional — empty/undefined until the backend provides them. */
  achievements?: Achievement[];
}

export interface Achievement {
  id: number;
  /** Emoji or short symbol shown on the badge (e.g. "🏆"). */
  icon?: string;
  title: string;
  description?: string;
  /** ISO date the badge was earned, if known. */
  earnedAt?: string;
}

export interface UserProfileRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string; // yyyy-MM-dd
  gender?: string;
  flatNo?: string;
  block?: string;
  bio?: string;
  skills?: string[];
  profilePicUrl?: string;
  coverPicUrl?: string;
}

// ─── Schedule Generation Log ─────────────────────────────────────────────────

export interface ScheduleGenerationLog {
  id: number;
  configId: number | null;
  eventId: number | null;
  communityId: number | null;
  generatedBy: number | null;
  generatedByName: string | null;
  action: string;
  status: string;
  tournamentType: string | null;
  totalTeams: number | null;
  totalMatches: number | null;
  totalGroups: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

// ─── App Notification ────────────────────────────────────────────────────────

export interface AppNotification {
  id: number;
  type: string;
  category: string;
  title: string;
  body: string | null;
  icon: string | null;
  actionUrl: string | null;
  referenceType: string | null;
  referenceId: number | null;
  priority: string;
  read: boolean;
  readAt: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface NotificationCountResponse {
  unreadCount: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ─── Community Feed ──────────────────────────────────────────────────────────

export interface PostResponse {
  id: number;
  content: string;
  imageUrl?: string;
  official: boolean;
  likesCount: number;
  commentsCount: number;
  likedByCurrentUser: boolean;
  authorId: number;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  createdAt: string;
  postType?: "GENERAL" | "CLASSIFIED" | "POLL" | "LOST_FOUND";
  price?: number;
  location?: string;
  pollQuestion?: string;
  pollOptionsList?: string[];
  pollVotes?: Record<string, number>;
  userVotedOption?: string;
}

export interface CommentResponse {
  id: number;
  postId: number;
  content: string;
  authorId: number;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  createdAt: string;
}

export interface LikeToggleResponse {
  likesCount: number;
  liked: boolean;
}

// ─── Community Directory ─────────────────────────────────────────────────────

export interface CommunityLeaderResponse {
  id: number;
  userId: number;
  fullName: string;
  profilePicUrl?: string;
  designation: string;
  committee?: string;
  contactPhone?: string;
  contactEmail?: string;
  flatNo?: string;
  block?: string;
  displayOrder: number;
}

export interface CommunityLeaderRequest {
  userId: number;
  designation: string;
  committee?: string;
  contactPhone?: string;
  contactEmail?: string;
  displayOrder?: number;
}

// ─── Chat (backend DTOs) ───────────────────────────────────────────────────────

export interface ChatContactDto {
  id: number;
  name: string;
  role: string;
  avatarInitials: string;
  isOnline: boolean;
  isVerified: boolean;
}

export interface ConversationDto {
  id: number;
  type: string; // DIRECT | GROUP
  title?: string | null;
  isGroup: boolean;
  contact?: ChatContactDto | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export interface ChatMessageDto {
  id: number;
  conversationId: number;
  senderId?: number | null;
  senderName?: string | null;
  type: string; // TEXT | SYSTEM
  content: string;
  createdAt: string;
}

/** Pushed on /topic/chat-user/{userId} so a client updates its list row without refetching. */
export interface ChatConversationEvent {
  conversationId: number;
  lastMessage: string;
  lastMessageAt: string;
  senderId: number;
}

export interface MenuRolePermissionResponse {
  id: number;
  roleId: number;
  roleName: string;
  menuId: number;
  menuKey: string;
  menuLabel: string;
  canView: boolean;
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// ─── Vendor Management System ───────────────────────────────────────────────

export type VendorStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "REJECTED" | "BLACKLISTED";
export type VendorRegistrationStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "INCOMPLETE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
export type WorkOrderStatus = "DRAFT" | "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CLOSED" | "CANCELLED";
export type WorkOrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
export type ProcurementStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ORDERED" | "RECEIVED" | "CANCELLED";
export type ContractStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "RENEWED" | "PENDING_RENEWAL";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED" | "DISPUTED";
export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentMethod = "BANK_TRANSFER" | "UPI" | "CHEQUE" | "CASH" | "WALLET" | "CARD";

export interface VendorCategoryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId: number | null;
  parentName: string | null;
  sortOrder: number;
  active: boolean;
  vendorCount?: number;
  children?: VendorCategoryResponse[];
}

export interface VendorCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface VendorOwner {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  profilePicUrl?: string;
}

export interface VendorDocument {
  id: number;
  vendorId: number;
  documentType: string;
  documentName: string;
  fileUrl: string;
  fileSize?: number;
  expiryDate?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  uploadedAt: string;
  version: number;
}

export interface VendorResponse {
  id: number;
  businessName: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  owner: VendorOwner;
  category: VendorCategoryResponse;
  status: VendorStatus;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  bannerUrl?: string;
  galleryUrls?: string[];
  gstNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  avgRating: number;
  totalRatings: number;
  totalBookings: number;
  totalRevenue: number;
  commissionRate?: number;
  communityId: number;
  documents?: VendorDocument[];
  tags?: string[];
  operatingHours?: VendorOperatingHours;
  isFeatured: boolean;
  isVerified: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorRequest {
  businessName: string;
  description?: string;
  shortDescription?: string;
  categoryId: number;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  bannerUrl?: string;
  galleryUrls?: string[];
  gstNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  commissionRate?: number;
  tags?: string[];
}

export interface VendorRegistrationResponse {
  id: number;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  categoryName: string;
  categoryId: number;
  status: VendorRegistrationStatus;
  description?: string;
  address?: string;
  documents?: VendorDocument[];
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface VendorRegistrationRequest {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  categoryId: number;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNumber?: string;
  panNumber?: string;
}

export interface VendorServiceResponse {
  id: number;
  vendorId: number;
  vendorName?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId?: number;
  categoryName?: string;
  price: number;
  priceUnit: string;
  discountPrice?: number;
  duration?: number;
  durationUnit?: string;
  imageUrl?: string;
  galleryUrls?: string[];
  active: boolean;
  featured: boolean;
  avgRating: number;
  totalBookings: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VendorServiceRequest {
  name: string;
  description?: string;
  shortDescription?: string;
  categoryId?: number;
  price: number;
  priceUnit?: string;
  discountPrice?: number;
  duration?: number;
  durationUnit?: string;
  imageUrl?: string;
  galleryUrls?: string[];
  tags?: string[];
}

export interface VendorOperatingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface VendorHoliday {
  id: number;
  vendorId: number;
  date: string;
  reason: string;
  type: "HOLIDAY" | "LEAVE" | "VACATION";
}

export interface VendorAvailability {
  operatingHours: VendorOperatingHours;
  holidays: VendorHoliday[];
  vacationMode: boolean;
  vacationStart?: string;
  vacationEnd?: string;
}

export interface VendorBookingResponse {
  id: number;
  bookingNumber: string;
  vendor: { id: number; businessName: string; logoUrl?: string; phone: string };
  customer: { id: number; fullName: string; email: string; phone: string; profilePicUrl?: string };
  service: { id: number; name: string; price: number; duration?: number };
  status: BookingStatus;
  scheduledDate: string;
  scheduledTime: string;
  endTime?: string;
  duration?: number;
  totalAmount: number;
  notes?: string;
  address?: string;
  cancellationReason?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorBookingRequest {
  vendorId: number;
  serviceId: number;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
  address?: string;
}

export interface WorkOrderResponse {
  id: number;
  workOrderNumber: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  vendor?: { id: number; businessName: string; phone: string };
  assignedTo?: { id: number; fullName: string };
  category?: string;
  location?: string;
  scheduledDate?: string;
  dueDate?: string;
  completedDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  attachments?: string[];
  timeline?: WorkOrderTimelineEntry[];
  createdBy: { id: number; fullName: string };
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderRequest {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  vendorId?: number;
  category?: string;
  location?: string;
  scheduledDate?: string;
  dueDate?: string;
  estimatedCost?: number;
  attachments?: string[];
}

export interface WorkOrderTimelineEntry {
  id: number;
  status: WorkOrderStatus;
  comment?: string;
  updatedBy: string;
  timestamp: string;
}

export interface PurchaseRequestResponse {
  id: number;
  requestNumber: string;
  title: string;
  description: string;
  status: ProcurementStatus;
  priority: WorkOrderPriority;
  requestedBy: { id: number; fullName: string };
  approvedBy?: { id: number; fullName: string };
  items: PurchaseRequestItem[];
  totalEstimate: number;
  department?: string;
  justification?: string;
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestItem {
  id: number;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

export interface PurchaseRequestRequest {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  items: Omit<PurchaseRequestItem, "id" | "totalPrice">[];
  department?: string;
  justification?: string;
}

export interface QuotationResponse {
  id: number;
  quotationNumber: string;
  purchaseRequestId: number;
  vendor: { id: number; businessName: string; email: string; phone: string };
  items: QuotationItem[];
  totalAmount: number;
  validUntil: string;
  termsAndConditions?: string;
  deliveryTimeline?: string;
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  submittedAt: string;
}

export interface QuotationItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remarks?: string;
}

export interface PurchaseOrderResponse {
  id: number;
  poNumber: string;
  vendor: { id: number; businessName: string; email: string; phone: string };
  quotationId?: number;
  purchaseRequestId?: number;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: ProcurementStatus;
  deliveryDate?: string;
  deliveryAddress?: string;
  termsAndConditions?: string;
  approvedBy?: { id: number; fullName: string };
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}

export interface GoodsReceiptResponse {
  id: number;
  grnNumber: string;
  purchaseOrderId: number;
  poNumber: string;
  vendor: { id: number; businessName: string };
  items: GoodsReceiptItem[];
  receivedDate: string;
  receivedBy: { id: number; fullName: string };
  remarks?: string;
  status: "PENDING" | "INSPECTED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: number;
  itemName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  remarks?: string;
}

export interface ContractResponse {
  id: number;
  contractNumber: string;
  title: string;
  vendor: { id: number; businessName: string; email: string; phone: string };
  status: ContractStatus;
  startDate: string;
  endDate: string;
  value: number;
  paymentTerms?: string;
  scope?: string;
  termsAndConditions?: string;
  autoRenew: boolean;
  renewalPeriod?: number;
  documentUrl?: string;
  signedByVendor: boolean;
  signedByAdmin: boolean;
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContractRequest {
  title: string;
  vendorId: number;
  startDate: string;
  endDate: string;
  value: number;
  paymentTerms?: string;
  scope?: string;
  termsAndConditions?: string;
  autoRenew?: boolean;
  renewalPeriod?: number;
  documentUrl?: string;
}

export interface VendorInvoiceResponse {
  id: number;
  invoiceNumber: string;
  vendor: { id: number; businessName: string; email: string };
  booking?: { id: number; bookingNumber: string };
  workOrder?: { id: number; workOrderNumber: string };
  contract?: { id: number; contractNumber: string };
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  notes?: string;
  communityId: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
}

export interface VendorInvoiceRequest {
  vendorId: number;
  bookingId?: number;
  workOrderId?: number;
  contractId?: number;
  items: Omit<InvoiceItem, "id">[];
  dueDate: string;
  notes?: string;
  taxAmount?: number;
  discountAmount?: number;
}

export interface VendorPaymentResponse {
  id: number;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  vendor: { id: number; businessName: string };
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  processedBy?: { id: number; fullName: string };
  remarks?: string;
  createdAt: string;
}

export interface VendorPaymentRequest {
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  remarks?: string;
}

export interface VendorRatingResponse {
  id: number;
  vendorId: number;
  vendorName: string;
  bookingId?: number;
  bookingNumber?: string;
  customer: { id: number; fullName: string; profilePicUrl?: string };
  rating: number;
  title?: string;
  comment?: string;
  reply?: string;
  repliedAt?: string;
  images?: string[];
  helpful: number;
  reported: boolean;
  moderated: boolean;
  moderationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";
  createdAt: string;
  updatedAt: string;
}

export interface VendorRatingRequest {
  vendorId: number;
  bookingId?: number;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface VendorPerformanceResponse {
  vendorId: number;
  vendorName: string;
  period: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  avgRating: number;
  totalRevenue: number;
  avgResponseTime: number;
  onTimeRate: number;
  repeatCustomerRate: number;
  slaCompliance: number;
  customerSatisfaction: number;
  monthlyTrend: MonthlyMetric[];
}

export interface MonthlyMetric {
  month: string;
  bookings: number;
  revenue: number;
  rating: number;
  completionRate: number;
}

export interface VendorDashboardStats {
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  suspendedVendors: number;
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgRating: number;
  totalWorkOrders: number;
  openWorkOrders: number;
  overdueInvoices: number;
  expiringContracts: number;
  categoryDistribution: { category: string; count: number }[];
  monthlyBookingTrend: { month: string; count: number }[];
  monthlyRevenueTrend: { month: string; amount: number }[];
  recentActivity: VendorActivityItem[];
  topVendors: { vendorId: number; vendorName: string; rating: number; bookings: number; revenue: number }[];
}

export interface VendorActivityItem {
  id: number;
  type: "VENDOR_REGISTERED" | "BOOKING_CREATED" | "BOOKING_COMPLETED" | "PAYMENT_RECEIVED" | "REVIEW_ADDED" | "WORK_ORDER_CREATED" | "CONTRACT_SIGNED";
  message: string;
  timestamp: string;
  vendorName?: string;
  referenceId?: number;
}

export interface VendorFavoriteResponse {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorLogo?: string;
  vendorCategory: string;
  vendorRating: number;
  addedAt: string;
}

export interface VendorSearchParams {
  search?: string;
  categoryId?: number;
  status?: VendorStatus;
  minRating?: number;
  maxRating?: number;
  city?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface VendorPortalStats {
  todayBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  avgRating: number;
  totalReviews: number;
  openWorkOrders: number;
  upcomingBookings: VendorBookingResponse[];
  recentPayments: VendorPaymentResponse[];
  ratingBreakdown: { stars: number; count: number }[];
}

