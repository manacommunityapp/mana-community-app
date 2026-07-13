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

