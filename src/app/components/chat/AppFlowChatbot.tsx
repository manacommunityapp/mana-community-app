import { useState, useRef, useEffect, useCallback } from "react";

// ─── Mana Community Modules ────────────────────────────────────────────────────

const MODULE_CATEGORIES = [
  {
    id: "core",
    label: "Core",
    modules: ["auth", "feed", "chat", "notifications", "profile"],
  },
  {
    id: "sports",
    label: "Sports",
    modules: ["sports_dashboard", "events", "registration", "auction", "scheduler", "sports_analytics"],
  },
  {
    id: "admin",
    label: "Admin",
    modules: ["admin", "venues", "roles"],
  },
  {
    id: "finance",
    label: "Finance",
    modules: ["finance", "inventory", "assets"],
  },
  {
    id: "community",
    label: "Community",
    modules: ["community_ops", "marketplace", "jobs"],
  },
];

const MODULES: Record<string, { label: string; icon: string; color: string; flows: { id: string; label: string; icon: string }[] }> = {
  auth: {
    label: "Account & Login",
    icon: "🔐",
    color: "#6366f1",
    flows: [
      { id: "login", label: "How to Log In", icon: "🔑" },
      { id: "signup", label: "Create an Account", icon: "✍️" },
      { id: "forgot_password", label: "Forgot Password", icon: "🔄" },
      { id: "otp_trouble", label: "OTP Not Received", icon: "📱" },
      { id: "kyc", label: "KYC Verification", icon: "🪪" },
      { id: "session_timeout", label: "Session Timeout", icon: "⏰" },
    ],
  },
  feed: {
    label: "Community Feed",
    icon: "📰",
    color: "#0ea5e9",
    flows: [
      { id: "create_post", label: "Create a Post", icon: "📝" },
      { id: "comment_post", label: "Comment on a Post", icon: "💬" },
      { id: "delete_post", label: "Delete a Post", icon: "🗑️" },
      { id: "feed_visibility", label: "Feed Visibility Rules", icon: "👁️" },
      { id: "community_guidelines", label: "Community Guidelines", icon: "📋" },
    ],
  },
  chat: {
    label: "Community Chat",
    icon: "💬",
    color: "#8b5cf6",
    flows: [
      { id: "start_dm", label: "Start a Direct Message", icon: "✉️" },
      { id: "group_chat", label: "Group Chat", icon: "👥" },
      { id: "admin_chat", label: "Admin Chat (Events)", icon: "🛡️" },
      { id: "chat_notifications", label: "Chat Notifications", icon: "🔔" },
    ],
  },
  notifications: {
    label: "Notifications",
    icon: "🔔",
    color: "#f59e0b",
    flows: [
      { id: "notif_types", label: "Notification Types", icon: "📋" },
      { id: "mark_read", label: "Mark Read / Dismiss", icon: "✅" },
      { id: "notif_preferences", label: "Notification Preferences", icon: "⚙️" },
    ],
  },
  profile: {
    label: "User Profile",
    icon: "👤",
    color: "#10b981",
    flows: [
      { id: "edit_profile", label: "Edit Your Profile", icon: "✏️" },
      { id: "profile_picture", label: "Update Profile Picture", icon: "📷" },
      { id: "kyc_docs", label: "Submit KYC Documents", icon: "📄" },
      { id: "account_settings", label: "Account Settings", icon: "⚙️" },
    ],
  },
  sports_dashboard: {
    label: "Sports Dashboard",
    icon: "🏆",
    color: "#6366f1",
    flows: [
      { id: "dashboard_overview", label: "Dashboard Overview", icon: "📊" },
      { id: "view_upcoming", label: "View Upcoming Events", icon: "📅" },
      { id: "stat_cards", label: "Understanding Stat Cards", icon: "📈" },
      { id: "sports_navigation", label: "Sports Tab Navigation", icon: "🧭" },
      { id: "my_registrations", label: "Check My Registrations", icon: "🎫" },
      { id: "find_my_team", label: "Find My Team", icon: "👥" },
      { id: "event_status_badges", label: "Event Status Badges", icon: "🏷️" },
      { id: "quick_register", label: "Quick Register for Event", icon: "⚡" },
      { id: "whats_happening", label: "What's Happening Now", icon: "🔴" },
    ],
  },
  events: {
    label: "Sports Events",
    icon: "📅",
    color: "#0ea5e9",
    flows: [
      { id: "create_event", label: "Create an Event (Admin)", icon: "➕" },
      { id: "edit_event", label: "Edit Event Details", icon: "✏️" },
      { id: "event_lifecycle", label: "Event Status Lifecycle", icon: "🔄" },
      { id: "event_venue_setup", label: "Venue & Date Setup", icon: "🏟️" },
      { id: "event_categories", label: "Player Categories", icon: "🏷️" },
      { id: "event_sponsors", label: "Add Sponsors", icon: "🤝" },
      { id: "share_event", label: "Share Event Link", icon: "🔗" },
      { id: "close_event", label: "Close/Cancel Event", icon: "🚫" },
    ],
  },
  registration: {
    label: "Player Registration",
    icon: "✍️",
    color: "#f59e0b",
    flows: [
      { id: "self_register", label: "Register for an Event", icon: "🏃" },
      { id: "uuid_register", label: "Register via Shared Link", icon: "🔗" },
      { id: "admin_approve", label: "Approve Registrations", icon: "✅" },
      { id: "captain_nominate", label: "Captain Nomination", icon: "🎖️" },
      { id: "captain_confirm", label: "Confirm Captain", icon: "👑" },
      { id: "withdraw_reg", label: "Withdraw Registration", icon: "↩️" },
      { id: "bulk_import", label: "Bulk Import (CSV)", icon: "📊" },
      { id: "reg_statuses", label: "Registration Statuses", icon: "📋" },
    ],
  },
  auction: {
    label: "Player Auction",
    icon: "🔨",
    color: "#ef4444",
    flows: [
      { id: "auction_config", label: "Auction Config Setup", icon: "⚙️" },
      { id: "player_pool", label: "Manage Player Pool", icon: "👥" },
      { id: "team_setup", label: "Create Teams & Budgets", icon: "🏏" },
      { id: "start_auction", label: "Start Live Auction", icon: "▶️" },
      { id: "bidding_flow", label: "Bidding Flow", icon: "💰" },
      { id: "sold_pass_queue", label: "Sold / Pass / Queue", icon: "🔄" },
      { id: "rtm_guide", label: "Right to Match (RTM)", icon: "🎯" },
      { id: "auction_csv", label: "Upload Players (CSV)", icon: "📤" },
      { id: "auction_results", label: "View Auction Results", icon: "📊" },
    ],
  },
  scheduler: {
    label: "Tournament Scheduler",
    icon: "📋",
    color: "#8b5cf6",
    flows: [
      { id: "group_assign", label: "Group Assignment", icon: "🗂️" },
      { id: "match_schedule", label: "Schedule Matches", icon: "📅" },
      { id: "venue_timing", label: "Venue Timing Setup", icon: "🕐" },
      { id: "playoff_bracket", label: "Playoff Bracket", icon: "🏆" },
      { id: "match_status", label: "Update Match Status", icon: "📝" },
      { id: "manual_schedule", label: "Manual Scheduling", icon: "✋" },
    ],
  },
  admin: {
    label: "Admin Dashboard",
    icon: "🛡️",
    color: "#6366f1",
    flows: [
      { id: "admin_overview", label: "Admin Dashboard Guide", icon: "📊" },
      { id: "create_user", label: "Create a User", icon: "👤" },
      { id: "bulk_upload", label: "Bulk User Upload", icon: "📤" },
      { id: "manage_users", label: "Manage Users", icon: "👥" },
      { id: "toggle_status", label: "Enable / Disable Users", icon: "🔀" },
      { id: "community_create", label: "Create a Community", icon: "🏘️" },
      { id: "audit_logs", label: "View Audit Logs", icon: "📜" },
      { id: "session_monitor", label: "Session Monitoring", icon: "📡" },
      { id: "system_logs", label: "System Logs", icon: "🖥️" },
    ],
  },
  venues: {
    label: "Venues & Courts",
    icon: "🏟️",
    color: "#10b981",
    flows: [
      { id: "add_venue", label: "Add a Venue", icon: "➕" },
      { id: "manage_courts", label: "Manage Courts", icon: "🎾" },
      { id: "venue_timing", label: "Set Venue Timings", icon: "🕐" },
      { id: "venue_map", label: "Add Map Link", icon: "🗺️" },
    ],
  },
  roles: {
    label: "Roles & Permissions",
    icon: "🔑",
    color: "#f59e0b",
    flows: [
      { id: "role_overview", label: "Roles Overview", icon: "📋" },
      { id: "create_role", label: "Create a Custom Role", icon: "➕" },
      { id: "permission_matrix", label: "Permission Matrix", icon: "🔢" },
      { id: "assign_role", label: "Assign Role to User", icon: "👤" },
    ],
  },
  marketplace: {
    label: "Marketplace",
    icon: "🛒",
    color: "#0ea5e9",
    flows: [
      { id: "browse_listings", label: "Browse Listings", icon: "🔍" },
      { id: "create_listing", label: "Create a Listing", icon: "➕" },
      { id: "edit_listing", label: "Edit / Delete Listing", icon: "✏️" },
      { id: "contact_seller", label: "Contact a Seller", icon: "💬" },
      { id: "search_marketplace", label: "Search & Filter", icon: "🔎" },
      { id: "listing_rules", label: "Listing Guidelines", icon: "📋" },
    ],
  },
  jobs: {
    label: "Jobs & Referrals",
    icon: "💼",
    color: "#8b5cf6",
    flows: [
      { id: "post_job", label: "Post a Job", icon: "📝" },
      { id: "apply_job", label: "Apply for a Job", icon: "📨" },
      { id: "referral_program", label: "Referral Program", icon: "🤝" },
      { id: "edit_job", label: "Edit / Close Job", icon: "✏️" },
      { id: "search_jobs", label: "Search & Filter Jobs", icon: "🔍" },
      { id: "view_applications", label: "View Applications", icon: "📋" },
    ],
  },
  finance: {
    label: "Finance & Billing",
    icon: "💰",
    color: "#059669",
    flows: [
      { id: "finance_overview", label: "Finance Dashboard", icon: "📊" },
      { id: "create_expense", label: "Create an Expense", icon: "➕" },
      { id: "approve_expense", label: "Approve / Reject Expense", icon: "✅" },
      { id: "invoice_management", label: "Invoice Management", icon: "📄" },
      { id: "gst_breakdown", label: "GST Preview & Breakdown", icon: "🧾" },
      { id: "budget_planning", label: "Budget Planning", icon: "📈" },
      { id: "financial_reports", label: "Financial Reports", icon: "📑" },
      { id: "ledger_guide", label: "Ledger & Accounts", icon: "📒" },
    ],
  },
  inventory: {
    label: "Inventory",
    icon: "📦",
    color: "#0891b2",
    flows: [
      { id: "inventory_dashboard", label: "Inventory Dashboard", icon: "📊" },
      { id: "add_inventory", label: "Add / Edit Items", icon: "➕" },
      { id: "stock_tracking", label: "Stock Level Tracking", icon: "📉" },
      { id: "inventory_management", label: "Inventory Management", icon: "⚙️" },
      { id: "inventory_search", label: "Search & Filter Items", icon: "🔍" },
    ],
  },
  assets: {
    label: "Assets & Expenses",
    icon: "🏷️",
    color: "#7c3aed",
    flows: [
      { id: "asset_checkout", label: "Asset Checkout Flow", icon: "🛒" },
      { id: "expense_upload", label: "Upload Expense Receipts", icon: "📤" },
      { id: "treasurer_queue", label: "Treasurer Approval Queue", icon: "📋" },
    ],
  },
  community_ops: {
    label: "Community Operations",
    icon: "🏘️",
    color: "#ea580c",
    flows: [
      { id: "procurement_dashboard", label: "Procurement Dashboard", icon: "📊" },
      { id: "raise_procurement", label: "Raise a Procurement Request", icon: "➕" },
      { id: "maintenance_dashboard", label: "Maintenance Dashboard", icon: "🔧" },
      { id: "raise_maintenance", label: "Raise a Maintenance Ticket", icon: "🎫" },
      { id: "asset_audit", label: "Asset Audit Trail", icon: "📜" },
      { id: "community_settings", label: "Community Settings", icon: "⚙️" },
    ],
  },
  sports_analytics: {
    label: "Sports Analytics",
    icon: "📊",
    color: "#4f46e5",
    flows: [
      { id: "analytics_dashboard", label: "Analytics Dashboard", icon: "📈" },
      { id: "participation_trends", label: "Participation Trends", icon: "📉" },
      { id: "event_reports", label: "Event Reports", icon: "📑" },
      { id: "export_analytics", label: "Export Analytics Data", icon: "📤" },
    ],
  },
};

// ─── Flow Step Data ────────────────────────────────────────────────────────────

const FLOW_DATA: Record<string, { title: string; steps: { step: number; name: string; desc: string; tip: string }[] }> = {
  // ── Auth ──
  login: {
    title: "How to Log In",
    steps: [
      { step: 1, name: "Open the App", desc: "Navigate to the Mana Community app in your browser. You'll see the login screen with email and password fields.", tip: "Bookmark the login page for quick access." },
      { step: 2, name: "Enter Credentials", desc: "Type your registered email address and password. If you signed up via OTP, use your phone number instead.", tip: "Check for extra spaces before/after your email — they cause login failures." },
      { step: 3, name: "Submit & Redirect", desc: "Click 'Login'. On success, you'll be taken to the Community Feed (home page). Your role determines which menu items you see.", tip: "If login fails, check if your account is active — admins can disable accounts." },
    ],
  },
  signup: {
    title: "Create an Account",
    steps: [
      { step: 1, name: "Click 'Sign Up'", desc: "From the login screen, click the 'Sign Up' link. You'll see a registration form.", tip: "You need a community invite or community code to join most communities." },
      { step: 2, name: "Fill Your Details", desc: "Enter your full name, email, phone number, and create a strong password. Select your community if prompted.", tip: "Use a real phone number — you'll need it for OTP verification." },
      { step: 3, name: "Verify via OTP", desc: "A 6-digit OTP is sent to your phone or email. Enter it within the time limit. You can request a resend if it doesn't arrive.", tip: "Check your spam folder if the email OTP doesn't appear in your inbox." },
      { step: 4, name: "Complete Profile", desc: "After verification, you'll be prompted to add your flat number, block, and other community-specific details.", tip: "Completing your profile helps community admins verify your identity faster." },
    ],
  },
  forgot_password: {
    title: "Forgot Password",
    steps: [
      { step: 1, name: "Click 'Forgot Password'", desc: "On the login screen, click the 'Forgot Password' link below the password field.", tip: "If you don't see this link, contact your community admin for a password reset." },
      { step: 2, name: "Enter Your Email", desc: "Type the email address associated with your account. A password reset OTP will be sent.", tip: "Use the same email you registered with — the system is case-sensitive." },
      { step: 3, name: "Verify OTP & Reset", desc: "Enter the 6-digit OTP and set a new password. The password must meet strength requirements (uppercase, lowercase, number, special character).", tip: "Your new password can't be the same as your current one." },
    ],
  },
  otp_trouble: {
    title: "OTP Not Received — Troubleshooting",
    steps: [
      { step: 1, name: "Wait 30 Seconds", desc: "OTPs can take up to 30 seconds to arrive, especially via SMS. Don't spam the resend button.", tip: "SMS delivery depends on your carrier — if you're in a low-signal area, try email OTP instead." },
      { step: 2, name: "Check Spam/Junk", desc: "If using email OTP, check your spam or junk folder. Mark it as 'Not Spam' so future OTPs arrive in your inbox.", tip: "Add noreply@manacommunity.com to your contacts to prevent spam filtering." },
      { step: 3, name: "Click Resend", desc: "Click the 'Resend OTP' button. A new code will be generated — the old one is invalidated. You typically get 3 resend attempts.", tip: "Each resend generates a NEW code — if you receive multiple, use the latest one." },
      { step: 4, name: "Contact Support", desc: "If OTP still doesn't arrive after 3 attempts, contact your community admin. They can verify your phone/email is correct in the system.", tip: "Your admin can also manually activate your account if OTP verification is stuck." },
    ],
  },
  kyc: {
    title: "KYC Verification",
    steps: [
      { step: 1, name: "Go to KYC Page", desc: "After signup, you may be redirected to the KYC verification page. You can also access it from Profile → KYC Verification.", tip: "KYC is required before you can access certain community features." },
      { step: 2, name: "Select ID Type", desc: "Choose your government ID type: Aadhaar, Voter ID, or Driving Licence.", tip: "Aadhaar is the fastest to verify — it uses automated validation." },
      { step: 3, name: "Enter ID Number", desc: "Type your ID number carefully. The system validates the format in real-time — you'll see a green checkmark when it's valid.", tip: "Double-check digits — a wrong ID number means manual admin review, which takes longer." },
      { step: 4, name: "Submit & Wait", desc: "Click Submit. Your KYC status changes to 'PENDING'. A community admin will review and approve it, changing status to 'VERIFIED'.", tip: "If your KYC is 'REJECTED', you can re-submit with corrected information." },
    ],
  },
  session_timeout: {
    title: "Session Timeout",
    steps: [
      { step: 1, name: "What Happens", desc: "For security, your session expires after a period of inactivity. You'll see a timeout warning before being logged out automatically.", tip: "The timeout countdown appears as a modal — click 'Stay Logged In' to extend your session." },
      { step: 2, name: "Re-Login", desc: "After timeout, you're redirected to the login page. Enter your credentials to resume. Your unsaved work may be lost.", tip: "Save any in-progress work (event forms, posts) before stepping away from the app." },
    ],
  },

  // ── Community Feed ──
  create_post: {
    title: "Create a Post",
    steps: [
      { step: 1, name: "Go to Community Feed", desc: "Click 'Community Feed' in the sidebar (the home page icon). You'll see the feed with all community posts.", tip: "The feed shows posts from YOUR community only — you can't see other communities' posts." },
      { step: 2, name: "Write Your Post", desc: "Click the post creation area at the top of the feed. Type your message — it supports text content.", tip: "Keep posts relevant to your community. Announcements, events, and helpful information work best." },
      { step: 3, name: "Publish", desc: "Click 'Post' to publish. Your post appears at the top of the feed immediately and is visible to all community members.", tip: "You need the 'Create Post' permission. If the button is disabled, contact your admin." },
    ],
  },
  comment_post: {
    title: "Comment on a Post",
    steps: [
      { step: 1, name: "Find the Post", desc: "Scroll through the community feed to find the post you want to comment on.", tip: "Recent posts appear at the top. Scroll down for older content." },
      { step: 2, name: "Type Your Comment", desc: "Click the comment area below the post. Type your comment and press Enter or click the send button.", tip: "Be constructive — comments are visible to the entire community." },
    ],
  },
  delete_post: {
    title: "Delete a Post",
    steps: [
      { step: 1, name: "Find Your Post", desc: "Locate the post you want to delete in the community feed.", tip: "You can only delete your own posts. Admins (ADMIN, SUPER_ADMIN, COMMUNITY_ADMIN) can delete any post." },
      { step: 2, name: "Click Delete", desc: "Click the delete icon (trash) on the post. Confirm the deletion when prompted.", tip: "Deletion is permanent — there's no 'undo'. Make sure you want to remove it." },
    ],
  },
  feed_visibility: {
    title: "Feed Visibility Rules",
    steps: [
      { step: 1, name: "Community-Scoped", desc: "The feed only shows posts from members of YOUR community. If you belong to 'Sunrise Apartments', you see posts from Sunrise Apartments only.", tip: "Super Admins can see all communities' feeds." },
      { step: 2, name: "Permission-Based", desc: "You need the 'View Feed' permission to see the feed at all. Without it, the Community Feed link is hidden from your sidebar.", tip: "If your feed is empty, it might mean no one in your community has posted yet — be the first!" },
    ],
  },
  community_guidelines: {
    title: "Community Guidelines",
    steps: [
      { step: 1, name: "Be Respectful", desc: "Treat all community members with respect. No harassment, bullying, or personal attacks.", tip: "When in doubt, ask yourself: would I say this to someone face-to-face?" },
      { step: 2, name: "Stay Relevant", desc: "Post content relevant to the community — announcements, events, maintenance updates, help requests.", tip: "Off-topic posts may be removed by admins." },
      { step: 3, name: "No Spam", desc: "Don't post advertisements or promotional content unless it's community-approved. Repeated violations may lead to account restrictions.", tip: "If you want to sell something, use the Marketplace section instead." },
    ],
  },

  // ── Chat ──
  start_dm: {
    title: "Start a Direct Message",
    steps: [
      { step: 1, name: "Go to Chat", desc: "Click 'Chat' in the sidebar navigation. You'll see your existing conversations on the left panel.", tip: "Chat uses real-time messaging via WebSocket — messages appear instantly." },
      { step: 2, name: "Start New Chat", desc: "Click the 'New Message' or '+' button. Search for a community member by name.", tip: "You can only message members within your community." },
      { step: 3, name: "Send Message", desc: "Type your message in the input field at the bottom and press Enter to send.", tip: "Messages are delivered in real-time. You'll see a typing indicator when the other person is responding." },
    ],
  },
  group_chat: {
    title: "Group Chat",
    steps: [
      { step: 1, name: "Find Group Chats", desc: "Group chats appear in your conversations list alongside direct messages. They have a group icon indicator.", tip: "Group chats are typically created for events, tournaments, or community-wide discussions." },
      { step: 2, name: "Participate", desc: "Open a group chat and send messages just like a direct message. All group members can see your messages.", tip: "Be mindful of notifications — active groups can generate many messages." },
    ],
  },
  admin_chat: {
    title: "Admin Chat for Events",
    steps: [
      { step: 1, name: "Enable Admin Chat", desc: "When creating a sports event or tournament, toggle 'Allow Admin Chat' to ON. This creates a dedicated chat channel for the event organizers.", tip: "Admin chat is separate from the regular event discussion — it's for organizers only." },
      { step: 2, name: "Access the Chat", desc: "Go to the event details and click the admin chat icon. Only users with admin/sports admin roles can see this.", tip: "Use this for coordination — discussing schedules, venues, disputes." },
    ],
  },
  chat_notifications: {
    title: "Chat Notifications",
    steps: [
      { step: 1, name: "Real-Time Alerts", desc: "New messages trigger a badge count on the Chat icon in the sidebar. You'll also see a notification bell update.", tip: "If you're not receiving notifications, check that you're connected (green status dot)." },
      { step: 2, name: "Mute Conversations", desc: "If a group is too active, you can mute it to stop receiving push notifications while still being able to read messages.", tip: "Muted conversations still show unread counts — you just won't get pop-up alerts." },
    ],
  },

  // ── Notifications ──
  notif_types: {
    title: "Notification Types",
    steps: [
      { step: 1, name: "Event Notifications", desc: "Registration confirmations, event status changes (opened, closed, live), schedule updates, and match results.", tip: "These are the most common notifications — they keep you updated on events you've registered for." },
      { step: 2, name: "Admin Notifications", desc: "User approvals, KYC verifications, role changes, and system alerts. Visible only to admin roles.", tip: "Admin notifications require prompt action — delays can block users from accessing the app." },
      { step: 3, name: "Community Notifications", desc: "New posts in your feed, comments on your posts, and community announcements.", tip: "Community notifications are lower priority — they won't interrupt you with urgent alerts." },
    ],
  },
  mark_read: {
    title: "Mark Read / Dismiss Notifications",
    steps: [
      { step: 1, name: "View Notifications", desc: "Click the bell icon in the header. A dropdown shows your recent notifications with unread count.", tip: "Unread notifications appear with a colored indicator. Read ones are dimmed." },
      { step: 2, name: "Mark Individual", desc: "Click on a notification to mark it as read and navigate to the relevant page (event, post, etc.).", tip: "You can also dismiss individual notifications without navigating — click the X button." },
      { step: 3, name: "Mark All Read", desc: "Click 'Mark All Read' at the top of the notification panel to clear all unread indicators at once.", tip: "Use 'Dismiss All' to remove all notifications from the panel entirely." },
    ],
  },
  notif_preferences: {
    title: "Notification Preferences",
    steps: [
      { step: 1, name: "Access Settings", desc: "Go to Profile → Settings → Notification Preferences. You'll see toggles for each notification category.", tip: "Changes take effect immediately — no need to save or restart." },
      { step: 2, name: "Choose Channels", desc: "Select how you want to receive each type: in-app, email, or push notification. You can mix and match.", tip: "Keep 'Event Status Changes' on at minimum — you don't want to miss a tournament going live." },
    ],
  },

  // ── Profile ──
  edit_profile: {
    title: "Edit Your Profile",
    steps: [
      { step: 1, name: "Go to Profile", desc: "Click your avatar or name in the top-right corner, then select 'Profile'. Or click 'Profile' in the sidebar.", tip: "Your profile is visible to other community members and admins." },
      { step: 2, name: "Edit Fields", desc: "Click 'Edit' to modify your name, email, phone, flat number, block, and other details. Some fields may be locked by your admin.", tip: "Email changes may require re-verification via OTP." },
      { step: 3, name: "Save Changes", desc: "Click 'Save' to update your profile. Changes are reflected immediately across the app.", tip: "Keep your flat number and block accurate — it's used for community verification." },
    ],
  },
  profile_picture: {
    title: "Update Profile Picture",
    steps: [
      { step: 1, name: "Go to Profile", desc: "Navigate to your profile page from the sidebar or top-right menu.", tip: "Your profile picture appears in the feed, chat, and registration lists." },
      { step: 2, name: "Click Avatar", desc: "Click on your current profile picture or the camera icon. A file picker will open.", tip: "Supported formats: JPG, PNG. Keep file size under 5MB for fast uploads." },
      { step: 3, name: "Upload & Crop", desc: "Select an image, crop it if needed, and confirm. The new picture is applied immediately.", tip: "Use a clear, well-lit face photo — it helps community members recognize you." },
    ],
  },
  kyc_docs: {
    title: "Submit KYC Documents",
    steps: [
      { step: 1, name: "Navigate to KYC", desc: "Go to Profile → KYC Verification. You'll see your current KYC status (PENDING, VERIFIED, or REJECTED).", tip: "KYC is required to unlock full access to community features." },
      { step: 2, name: "Choose ID Type", desc: "Select your government ID type: Aadhaar, Voter ID, or Driving Licence.", tip: "Use the same ID type you selected during initial signup for consistency." },
      { step: 3, name: "Submit", desc: "Enter your ID number and submit. A community admin will review and approve within 24-48 hours.", tip: "If rejected, you'll see the reason. Fix the issue and re-submit." },
    ],
  },
  account_settings: {
    title: "Account Settings",
    steps: [
      { step: 1, name: "Access Settings", desc: "Go to Profile → Settings. You'll find security, notification, and display preferences.", tip: "Settings are saved automatically when you toggle a switch." },
      { step: 2, name: "Change Password", desc: "Click 'Change Password'. Enter your current password, then your new password twice. The strength meter shows password quality.", tip: "Use a mix of uppercase, lowercase, numbers, and special characters for a strong password." },
    ],
  },

  // ── Sports Dashboard ──
  dashboard_overview: {
    title: "Sports Dashboard Overview",
    steps: [
      { step: 1, name: "Access Dashboard", desc: "Click 'Sports' in the sidebar. The dashboard is the default landing page showing your sports activity overview.", tip: "The dashboard updates in real-time — no need to refresh the page." },
      { step: 2, name: "Stat Cards", desc: "At the top, you'll see stat cards showing: Total Events, Open Registrations, Upcoming Matches, and Active Auctions. These are specific to your community.", tip: "Click on any stat card to navigate to the relevant section for details." },
      { step: 3, name: "Upcoming Events", desc: "Below the stats, you'll see a list of upcoming events sorted by date with quick action buttons (Register, View Schedule).", tip: "Events with a green badge are open for registration. Red means registration is closed." },
      { step: 4, name: "My Registrations", desc: "The 'My Registrations' section shows events you've registered for, with status (PENDING, CONFIRMED) and captain nomination info.", tip: "If your registration is PENDING, it means an admin hasn't approved it yet." },
    ],
  },
  view_upcoming: {
    title: "View Upcoming Events",
    steps: [
      { step: 1, name: "Dashboard List", desc: "The sports dashboard shows upcoming events sorted by start date. Each row shows event name, sport, dates, and status.", tip: "Events are filtered to your community unless you're a Super Admin." },
      { step: 2, name: "Click to Open", desc: "Click any event to see full details: description, venue, categories, registration count, and organizer contacts.", tip: "From the event detail view, you can register directly if registration is open." },
    ],
  },
  stat_cards: {
    title: "Understanding Stat Cards",
    steps: [
      { step: 1, name: "Total Events", desc: "Shows the total number of sports events created in your community. Includes all statuses (draft, open, closed, completed).", tip: "This gives you a sense of how active your community is in sports." },
      { step: 2, name: "Open Registrations", desc: "Number of events currently accepting player registrations. These are actionable — you can sign up now.", tip: "Don't wait — popular events fill up quickly when max participants is set." },
      { step: 3, name: "Auctions", desc: "Active auction configs in your community — shows how many player auctions are configured or running.", tip: "If you see an auction in LIVE status, head to the Auction tab to watch or participate." },
    ],
  },
  sports_navigation: {
    title: "Sports Tab Navigation",
    steps: [
      { step: 1, name: "Dashboard", desc: "The home tab — shows overview stats, upcoming events, and your registrations. Start here to see what's happening.", tip: "This is your daily sports check-in page." },
      { step: 2, name: "My Sports", desc: "Shows events you've registered for, your captain nominations, and personal sports history.", tip: "Check this tab to track your registration status and upcoming matches." },
      { step: 3, name: "Schedule", desc: "View match schedules for any event — group stages, knockouts, and playoffs with dates, times, and venues.", tip: "Select a specific event from the dropdown to see its schedule." },
      { step: 4, name: "Auction", desc: "Configure and run player auctions. Set budgets, manage player pools, and run live bidding sessions.", tip: "You need auction permissions to access this tab." },
      { step: 5, name: "Admin", desc: "Sports administration — create events, manage categories, configure sports metadata. Admin/Sports Admin only.", tip: "This tab is hidden if you don't have 'Create/Edit Sports Main' permission." },
      { step: 6, name: "Analytics", desc: "View sports analytics — event participation trends, registration stats, and auction summaries.", tip: "Analytics data is community-scoped and updates as events complete." },
    ],
  },

  // ── Sports Dashboard (additional flows) ──
  my_registrations: {
    title: "Check My Registrations",
    steps: [
      { step: 1, name: "Go to My Sports", desc: "Click the 'My Sports' tab in the sports section. This shows all events you've registered for.", tip: "You can also see a quick summary on the Sports Dashboard under 'My Registrations' section." },
      { step: 2, name: "View Your Status", desc: "Each registration shows: event name, category you registered in, status (PENDING, CONFIRMED, REJECTED), and captain nomination status.", tip: "PENDING means an admin hasn't reviewed your registration yet — check back later or contact the organizer." },
      { step: 3, name: "Track Upcoming Matches", desc: "For confirmed registrations, you'll see your upcoming matches with date, time, venue, and opponent details.", tip: "Enable notifications to get alerts when match schedules are published or updated." },
      { step: 4, name: "View Past Results", desc: "Completed events show your match history, team placement, and personal stats if recorded.", tip: "Your sports history builds over time — it's visible to organizers for future event selections." },
    ],
  },
  find_my_team: {
    title: "Find My Team",
    steps: [
      { step: 1, name: "After Auction", desc: "Once the player auction is completed, go to Sports → Auction → select the event. Your team assignment appears under 'Auction Results'.", tip: "If the auction hasn't happened yet, team assignments aren't available. Check the event status." },
      { step: 2, name: "Team Details", desc: "Click on your team to see: team name, captain, all team members, total spent, remaining budget, and team color.", tip: "Screenshot your team roster and share it in the event group chat for coordination." },
      { step: 3, name: "Team Chat", desc: "If the organizer enabled team chats, you'll find a dedicated team chat channel in the Chat section after teams are formed.", tip: "Use the team chat to coordinate practice sessions and discuss strategy before matches." },
      { step: 4, name: "Match Schedule", desc: "Go to Sports → Schedule → select the event. Find matches where your team is playing — highlighted with your team color.", tip: "Add match dates to your personal calendar so you don't miss a game." },
    ],
  },
  event_status_badges: {
    title: "Event Status Badges Explained",
    steps: [
      { step: 1, name: "Green — Open", desc: "A green badge means the event is currently accepting registrations. You can sign up now!", tip: "Don't wait too long — popular events reach max participants quickly." },
      { step: 2, name: "Blue — Upcoming", desc: "A blue badge means the event is scheduled but registration hasn't opened yet. Check back on the registration start date.", tip: "Follow the event to get notified when registration opens." },
      { step: 3, name: "Orange — In Progress", desc: "An orange badge means the event is currently LIVE — matches are being played. Check the Schedule tab for live updates.", tip: "If you're a participant, ensure you arrive at the venue on time for your scheduled match." },
      { step: 4, name: "Red — Closed", desc: "A red badge means registration is closed. You can still view event details but can't register.", tip: "Contact the event organizer if you missed registration — they may be able to add you manually." },
      { step: 5, name: "Gray — Completed / Cancelled", desc: "A gray badge means the event is finished or was cancelled. Results are available for completed events.", tip: "Check Analytics for detailed event reports and your personal performance data." },
    ],
  },
  quick_register: {
    title: "Quick Register for an Event",
    steps: [
      { step: 1, name: "From Dashboard", desc: "On the Sports Dashboard, look for events with a green 'Register' button next to them. Click it to jump directly to the registration form.", tip: "The dashboard shows the most relevant open events at the top." },
      { step: 2, name: "Select Category", desc: "Choose your player category from the dropdown. Only categories matching your age and gender are shown.", tip: "If you don't see any categories, the event may have age/gender restrictions that don't match your profile." },
      { step: 3, name: "Confirm & Submit", desc: "Review your details (auto-filled from your profile), add any optional info (role preference, partner for doubles), and click 'Register'.", tip: "Registration takes seconds — your profile details are pre-filled so you just need to confirm." },
      { step: 4, name: "Check Status", desc: "After submitting, your registration appears in 'My Sports' with status PENDING or CONFIRMED depending on event settings.", tip: "You'll receive a notification when your registration is approved or if any action is needed." },
    ],
  },
  whats_happening: {
    title: "What's Happening Right Now",
    steps: [
      { step: 1, name: "Live Events", desc: "On the Sports Dashboard, the 'Live Now' section shows events currently in progress with real-time match updates.", tip: "Live events have an animated red dot indicator — they're always at the top of the dashboard." },
      { step: 2, name: "Today's Matches", desc: "The 'Today' section shows all matches scheduled for today: teams, time, venue, court, and current status.", tip: "Matches update in real-time via WebSocket — no need to refresh the page." },
      { step: 3, name: "Active Auctions", desc: "If a player auction is LIVE, you'll see a prominent banner on the dashboard. Click it to watch or participate in bidding.", tip: "Live auctions are time-sensitive — join quickly to not miss player picks." },
      { step: 4, name: "Recent Activity", desc: "The activity feed shows recent actions: new registrations, match results, team formations, and announcements from organizers.", tip: "This is the best place to stay updated without checking each section individually." },
    ],
  },

  // ── Events ──
  create_event: {
    title: "Create a Sports Event (Admin)",
    steps: [
      { step: 1, name: "Go to Sports Admin", desc: "Navigate to Sports → Admin tab. You'll see sections for Sports Meta, Events, and Categories.", tip: "You need 'Create/Edit Sports Main' permission. If the tab is hidden, ask your admin for access." },
      { step: 2, name: "Click 'Create Event'", desc: "In the Events section, click the '+ Create Event' button. A form opens with all event configuration fields.", tip: "Choose the sport type first — it determines available categories and formats." },
      { step: 3, name: "Fill Basic Details", desc: "Enter: Event Name, Sport, Event Dates (start/end), Registration Dates (open/close), Description, and Tournament Level.", tip: "Set registration close date BEFORE event start date to give time for team formation." },
      { step: 4, name: "Set Venue & Participants", desc: "Select a venue (or create one), set max participants, start/due times, and choose the tournament format (Knockout, Round Robin, League, etc.).", tip: "If the venue isn't listed, go to Admin → Venues to add it first." },
      { step: 5, name: "Configure Categories", desc: "Add player categories (Men's Open, Women's Under-16, etc.) with age ranges and gender filters.", tip: "Categories determine who can register — set age limits carefully." },
      { step: 6, name: "Add Contacts & Sponsors", desc: "Add organizer contact details and event sponsors (with category: Title, Gold, Silver).", tip: "Contact details are visible on the registration page — include a reachable phone number." },
      { step: 7, name: "Save & Open", desc: "Click 'Save'. The event is created in DRAFT status. Change status to 'REGISTRATION_OPEN' when you're ready for signups.", tip: "Review all details before opening registration — changing categories after registrations start can cause issues." },
    ],
  },
  edit_event: {
    title: "Edit Event Details",
    steps: [
      { step: 1, name: "Find the Event", desc: "Go to Sports → Admin → Events section. Find your event in the list.", tip: "Use the search or filter by status to find events quickly." },
      { step: 2, name: "Click Edit", desc: "Click the edit icon on the event. The event form opens with pre-filled values.", tip: "Some fields may be locked once registrations exist — dates and categories are sensitive." },
      { step: 3, name: "Update & Save", desc: "Make your changes and click Save. If the event is already open, changes are reflected immediately to users.", tip: "If you change dates, consider notifying registered players via the community feed." },
    ],
  },
  event_lifecycle: {
    title: "Event Status Lifecycle",
    steps: [
      { step: 1, name: "DRAFT", desc: "Initial state when an event is created. Not visible to regular users. Use this to configure everything before going live.", tip: "Take your time in draft — once you open registration, users start signing up immediately." },
      { step: 2, name: "REGISTRATION_OPEN", desc: "Event is visible and accepting registrations. Players can sign up via the registration page or shared UUID link.", tip: "Monitor registration counts regularly. Close early if you hit max participants." },
      { step: 3, name: "REGISTRATION_CLOSED", desc: "No more registrations accepted. Use this to finalize participant lists, form teams, and set up the schedule.", tip: "You can still manually add players after closing registration via bulk import." },
      { step: 4, name: "LIVE", desc: "The event/tournament is actively happening. Match schedules are running, results are being updated.", tip: "During LIVE status, focus on match status updates and real-time coordination." },
      { step: 5, name: "COMPLETED", desc: "All matches are done. Final results are published. The event is archived but still viewable.", tip: "After completion, check analytics for participation reports and trends." },
      { step: 6, name: "CANCELLED", desc: "Event was cancelled before completion. Registered players are notified.", tip: "Use this sparingly — cancellations affect community trust. Consider postponing instead." },
    ],
  },
  event_venue_setup: {
    title: "Venue & Date Setup",
    steps: [
      { step: 1, name: "Select Venue", desc: "In the event form, choose a venue from the dropdown. The venue provides address, courts, and capacity information.", tip: "If your venue isn't listed, go to Admin → Venues to create it first." },
      { step: 2, name: "Set Dates", desc: "Configure: Event Start/End dates, Registration Start/End dates, and daily Start/Due times.", tip: "Registration should close at least 1-2 days before the event to allow scheduling." },
      { step: 3, name: "Map Link", desc: "The venue's map link (Google Maps) is shown on the registration page so players can find directions.", tip: "Verify the map link opens to the correct location before publishing the event." },
    ],
  },
  event_categories: {
    title: "Player Categories",
    steps: [
      { step: 1, name: "Understand Categories", desc: "Categories define player groups: Men's Open, Women's Under-18, Boys Under-12, etc. Each has age limits and gender filter.", tip: "DEFAULT categories are available to all communities. USER categories are community-specific." },
      { step: 2, name: "Create a Category", desc: "Go to Sports Admin → Categories → Create. Enter name, age range (min/max), gender (MALE, FEMALE, ALL), and type.", tip: "Category types: DEFAULT (global), USER (community-specific), VENDOR (vendor-created)." },
      { step: 3, name: "Assign to Events", desc: "When creating an event, select which categories are available for registration. Players choose their category during signup.", tip: "Offer categories that match your community demographics — too many categories can split a small player pool." },
    ],
  },
  event_sponsors: {
    title: "Add Event Sponsors",
    steps: [
      { step: 1, name: "Open Event Edit", desc: "In the event creation/edit form, scroll to the 'Sponsors' section.", tip: "Sponsors are displayed on the event page and registration confirmation." },
      { step: 2, name: "Add Sponsors", desc: "Click 'Add Sponsor'. Enter: Category (Title, Gold, Silver, Bronze), Sponsor Name, and optional URL/website.", tip: "Title sponsors get the most prominent placement. Limit to 1 Title, 2-3 Gold for clarity." },
      { step: 3, name: "Save", desc: "Sponsors are saved with the event. They appear on event details and the public registration page.", tip: "Add sponsors early — they're good visibility for your event's credibility." },
    ],
  },
  share_event: {
    title: "Share Event Registration Link",
    steps: [
      { step: 1, name: "Get the UUID Link", desc: "Each event has a unique UUID-based registration link: /sports/register/{uuid}. This link is safe to share publicly — it doesn't expose the database ID.", tip: "The UUID link works even if the user isn't logged in — they'll be prompted to login first." },
      { step: 2, name: "Share", desc: "Copy the link and share via WhatsApp, email, or your community group. Anyone with the link and a Mana Community account can register.", tip: "Include event name and dates in your share message — context helps drive registrations." },
    ],
  },
  close_event: {
    title: "Close / Cancel an Event",
    steps: [
      { step: 1, name: "Change Status", desc: "Go to Sports Admin → Events → find your event. Use the status dropdown to change from REGISTRATION_OPEN to REGISTRATION_CLOSED or CANCELLED.", tip: "CLOSED means no more registrations but the event proceeds. CANCELLED means the event won't happen." },
      { step: 2, name: "Notify Players", desc: "Post an announcement in the community feed about the status change. For cancellations, explain the reason.", tip: "For closed events, share the final participant count and next steps (schedule, teams)." },
    ],
  },

  // ── Registration ──
  self_register: {
    title: "Register for a Sports Event",
    steps: [
      { step: 1, name: "Find an Open Event", desc: "Go to Sports → Dashboard or My Sports. Look for events with 'Open' registration status.", tip: "You can also register via a shared UUID link if someone shared an event with you." },
      { step: 2, name: "Click Register", desc: "Click the 'Register' button on the event. The registration form opens showing available categories.", tip: "If the button is disabled, either registration is closed or you've already registered." },
      { step: 3, name: "Select Category", desc: "Choose your player category (e.g., Men's Open, Women's Under-18). Your age must fall within the category's age range.", tip: "If no categories appear, the event organizer hasn't configured them yet — contact them." },
      { step: 4, name: "Fill Player Details", desc: "Enter your name, role (if applicable, e.g., Batsman, Bowler), age, and match type preference.", tip: "For doubles events, you can optionally select a partner from the community member list." },
      { step: 5, name: "Submit", desc: "Click 'Submit Registration'. Your status is either CONFIRMED (auto-approve) or PENDING (requires admin approval), depending on event settings.", tip: "Check the 'adminApprovalRequired' setting — if ON, your admin must confirm your registration." },
    ],
  },
  uuid_register: {
    title: "Register via Shared Link",
    steps: [
      { step: 1, name: "Open the Link", desc: "Click the shared event link (looks like: /sports/register/abc-123-def-456). You'll see the event details and registration form.", tip: "If you're not logged in, you'll be redirected to login first, then back to the registration page." },
      { step: 2, name: "Review Event", desc: "The page shows event name, sport, dates, venue, age limits, and available categories. Review these before registering.", tip: "The UUID link is public but registration still requires authentication." },
      { step: 3, name: "Complete Registration", desc: "Fill in the registration form and submit. Same process as registering from the dashboard.", tip: "You can share this link with friends — each person needs their own Mana Community account to register." },
    ],
  },
  admin_approve: {
    title: "Approve Registrations (Admin)",
    steps: [
      { step: 1, name: "View Registrations", desc: "Go to Sports → Dashboard → click on an event → Registrations tab. You'll see all registrations with their status.", tip: "This is only visible if you have 'Create/Edit Event Registrations' permission." },
      { step: 2, name: "Review Player", desc: "Each registration shows: player name, category, age, status. PENDING registrations need your action.", tip: "Check that the player meets the category's age and gender requirements before approving." },
      { step: 3, name: "Approve or Reject", desc: "Click 'Confirm' to approve (→ CONFIRMED) or 'Reject' with an optional reason (→ REJECTED).", tip: "Rejected players are notified with your reason. Be specific so they can re-register correctly." },
    ],
  },
  captain_nominate: {
    title: "Captain Nomination",
    steps: [
      { step: 1, name: "What Is It", desc: "In team sports with auctions, players can nominate themselves as team captain. This signals to auction admins that they're willing to lead a team.", tip: "Captain nomination is separate from registration — you register first, then nominate." },
      { step: 2, name: "Nominate Yourself", desc: "From My Sports → find your registration → click 'Nominate as Captain'. Optionally propose a team name.", tip: "You can withdraw your nomination anytime before the captain confirmation deadline." },
      { step: 3, name: "Admin Confirms", desc: "A sports admin reviews nominations and confirms selected captains. Confirmed captains get assigned to teams in the auction.", tip: "Not all nominations are accepted — admins select based on experience, sportsmanship, and balance." },
    ],
  },
  captain_confirm: {
    title: "Confirm Captain (Admin)",
    steps: [
      { step: 1, name: "View Nominations", desc: "Go to the event's registration list. Filter by 'Captain Nominated' to see all players who have self-nominated.", tip: "Look for captainNomination = true with captainConfirmation still null/false." },
      { step: 2, name: "Confirm or Deny", desc: "Click 'Confirm Captain' for approved captains. They'll be assigned as team captains in the auction team setup.", tip: "Consider balance — aim for an equal number of experienced captains across teams." },
    ],
  },
  withdraw_reg: {
    title: "Withdraw Registration",
    steps: [
      { step: 1, name: "Go to My Sports", desc: "Navigate to Sports → My Sports. Find the event you want to withdraw from.", tip: "You can only withdraw your own registration. Admins can remove any player." },
      { step: 2, name: "Click Withdraw", desc: "Click the 'Withdraw' button. Confirm when prompted. Your status changes to WITHDRAWN.", tip: "Withdrawal is permanent for that registration — you'd need to re-register if you change your mind." },
    ],
  },
  bulk_import: {
    title: "Bulk Import Registrations (CSV)",
    steps: [
      { step: 1, name: "Prepare CSV", desc: "Create a CSV file with columns: playerName, email, category, age, role. One player per row.", tip: "Download the template from the import dialog to see the exact format required." },
      { step: 2, name: "Upload", desc: "Go to Sports Admin → Event → Registrations → 'Import CSV'. Select your file and click Upload.", tip: "The system validates each row — invalid entries are skipped with error messages." },
      { step: 3, name: "Review Results", desc: "After upload, you'll see a summary: X imported, Y failed. Failed rows show the reason (invalid email, age out of range, etc.).", tip: "Fix failed rows in the CSV and re-upload just those entries." },
    ],
  },
  reg_statuses: {
    title: "Registration Status Meanings",
    steps: [
      { step: 1, name: "PENDING", desc: "Registration submitted but awaiting admin approval. The player cannot participate until approved.", tip: "This appears when the event has 'Admin Approval Required' enabled." },
      { step: 2, name: "REGISTERED", desc: "Registration submitted and auto-accepted. The player is in the participant list but not yet formally confirmed.", tip: "This is the initial status when auto-approval is on." },
      { step: 3, name: "CONFIRMED", desc: "Admin has confirmed the registration. The player is officially in the event and can be scheduled for matches.", tip: "This is the 'green light' status — the player will appear in scheduling tools." },
      { step: 4, name: "WITHDRAWN", desc: "Player voluntarily withdrew from the event. Their spot is freed for others.", tip: "Withdrawn players don't count toward max participants." },
      { step: 5, name: "REJECTED", desc: "Admin rejected the registration. A reason is usually provided (wrong category, ineligible age, etc.).", tip: "Rejected players can re-register with corrected information." },
    ],
  },

  // ── Auction ──
  auction_config: {
    title: "Auction Configuration Setup",
    steps: [
      { step: 1, name: "Go to Auction Tab", desc: "Navigate to Sports → Auction. If no config exists, you'll see a 'Create Auction Config' button.", tip: "You need 'Create/Edit Auction Configuration' permission. Ask your admin if the button is missing." },
      { step: 2, name: "Basic Settings", desc: "Configure: Sport, Season Name, Auction Format, Total Teams, Total Players, Budget per Team, and Base Price.", tip: "Budget per team is the maximum amount each team can spend. Set it based on your player pool size." },
      { step: 3, name: "Bid Rules", desc: "Set bid increment rules: Default Increment, Threshold Amount (where increment changes), and Increment Above Threshold.", tip: "Example: Default ₹100 increment up to ₹5000, then ₹500 increment above ₹5000." },
      { step: 4, name: "Advanced Options", desc: "Configure: Bid Timer (seconds per bid), RTM Enabled (Right to Match), Unsold Rule, Categories, and Committee Members.", tip: "Bid timer of 15-20 seconds keeps the auction moving. Too long = boring, too short = stressful." },
      { step: 5, name: "Save", desc: "Click Save. Config is created in DRAFT status. You'll need to add players and teams before going ACTIVE.", tip: "Don't change to ACTIVE until all players and teams are set up — it's hard to modify a live config." },
    ],
  },
  player_pool: {
    title: "Manage Player Pool",
    steps: [
      { step: 1, name: "View Players", desc: "In the Auction tab, select your config. The Player Pool section shows all registered players with their base price, category, and status.", tip: "Players come from event registrations — they're automatically added when they register for the linked event." },
      { step: 2, name: "Add Manually", desc: "Click 'Add Player' to manually add a player. Enter name, category, base price, role, and optional stats.", tip: "Manual adds are useful for players who registered offline or via paper forms." },
      { step: 3, name: "Upload CSV", desc: "Click 'Upload CSV' to bulk-add players. The CSV should include: playerName, category, basePrice, playerRole, age.", tip: "Download the template first — column names must match exactly." },
      { step: 4, name: "Player Statuses", desc: "Players start as UNSOLD. During auction: SELLING (currently on block), SOLD, PASSED, QUEUED (for re-auction).", tip: "PASSED players go to the back of the queue for a second round of bidding." },
    ],
  },
  team_setup: {
    title: "Create Teams & Set Budgets",
    steps: [
      { step: 1, name: "Go to Teams", desc: "In the Auction tab, navigate to the Teams section. Click 'Add Team' to create a new team.", tip: "Create all teams BEFORE starting the auction — you can't add teams during a live auction." },
      { step: 2, name: "Team Details", desc: "Enter: Team Name, Owner Name (optional owner user), Color, and Total Budget (must match config's budget per team).", tip: "Use distinct colors for each team — they're shown in the live auction UI." },
      { step: 3, name: "Captain Assignment", desc: "If captains were confirmed during registration, assign them to teams here. Each team can have one captain.", tip: "Captains are typically 'retained' — they don't go through the auction bidding process." },
    ],
  },
  start_auction: {
    title: "Start a Live Auction",
    steps: [
      { step: 1, name: "Pre-Checks", desc: "Before going live, verify: all players are added, all teams are created, budget is set, and bid rules are configured.", tip: "Run through a quick checklist — missing setup causes mid-auction problems." },
      { step: 2, name: "Change to ACTIVE", desc: "Set the auction config status from DRAFT to ACTIVE. This locks the configuration and enables the live auction controls.", tip: "ACTIVE doesn't start bidding — it just means the auction is ready to go." },
      { step: 3, name: "Go LIVE", desc: "Change status to LIVE. This enables the bidding interface. A random player is picked (or you manually select one) to start.", tip: "Announce to all participants that the auction is live — share the Auction tab link." },
      { step: 4, name: "Run the Auction", desc: "Players appear one at a time. Teams bid in increments. Use Sold, Pass, or Queue buttons to manage each player.", tip: "The bid timer auto-counts down. If it expires with no new bid, the current highest bidder wins." },
    ],
  },
  bidding_flow: {
    title: "Bidding Flow",
    steps: [
      { step: 1, name: "Player on Block", desc: "A player appears with their name, category, base price, and stats. The current bid starts at the base price.", tip: "All teams can see the player details simultaneously via the live auction screen." },
      { step: 2, name: "Place a Bid", desc: "Click 'Bid' to place a bid at the current price + increment. The bid timer resets with each new bid.", tip: "Budget check happens automatically — you can't bid more than your team's remaining budget." },
      { step: 3, name: "Bid War", desc: "Multiple teams bid back and forth. The price rises by the configured increment each time. Above the threshold, the increment increases.", tip: "Watch your remaining budget — don't overspend on one player if you need more players." },
      { step: 4, name: "Timer Expires", desc: "When the bid timer reaches zero with no new bid, the player is 'Going... Going... Gone!' to the highest bidder.", tip: "The auctioneer (admin) clicks 'Sold' to finalize the sale." },
    ],
  },
  sold_pass_queue: {
    title: "Sold / Pass / Queue Mechanics",
    steps: [
      { step: 1, name: "SOLD", desc: "Admin clicks 'Sold' after the bid timer expires. The player is assigned to the winning team. Team's budget is reduced by the sold price.", tip: "Sold price and team assignment are recorded permanently — they appear in auction results." },
      { step: 2, name: "PASS", desc: "If no team bids on a player, admin clicks 'Pass'. The player's status becomes PASSED and they move to the unsold pool.", tip: "Passed players get a second chance in later rounds, typically at a reduced base price." },
      { step: 3, name: "QUEUE", desc: "Admin can 'Queue' a player to auction them later. Useful for managing the order of players strategically.", tip: "Queue order can be customized — drag and drop players to set the desired sequence." },
      { step: 4, name: "Re-Auction", desc: "After all players have been through once, unsold/passed players are brought back for another round at the same or reduced base price.", tip: "The unsold rule in the config determines whether base price drops for re-auctioned players." },
    ],
  },
  rtm_guide: {
    title: "Right to Match (RTM)",
    steps: [
      { step: 1, name: "What Is RTM", desc: "RTM allows a team to match the winning bid of another team and claim the player. It's typically given to the player's previous team from last season.", tip: "RTM must be enabled in the auction config — it's not available by default." },
      { step: 2, name: "How It Works", desc: "After a player is sold, teams with RTM rights are given a window to match the price. If they match, the player goes to them instead.", tip: "RTM is usually limited — teams might get 2-3 RTM cards for the entire auction." },
      { step: 3, name: "Declining RTM", desc: "If the RTM team declines (or the window expires), the original sale stands. The player stays with the winning bidder.", tip: "Strategic use of RTM can retain key players — but it costs the same as the winning bid." },
    ],
  },
  auction_csv: {
    title: "Upload Players via CSV",
    steps: [
      { step: 1, name: "Prepare File", desc: "Create a CSV with columns: playerName, category, basePrice, playerRole, age, matches, runs, wickets, strikeRate, economy, avgScore.", tip: "Only playerName, category, and basePrice are required. Stats fields are optional." },
      { step: 2, name: "Upload", desc: "Go to Auction Config → click 'Upload Players'. Select your CSV file.", tip: "Large files (500+ players) may take a few seconds to process." },
      { step: 3, name: "Review", desc: "The upload result shows: rows imported, rows failed, and error details for failed rows.", tip: "Common errors: duplicate names, invalid category, base price = 0." },
    ],
  },
  auction_results: {
    title: "View Auction Results",
    steps: [
      { step: 1, name: "After Completion", desc: "Once the auction status is COMPLETED, the results are finalized. Go to Auction → select the config to view results.", tip: "Results include: all sold players with prices, team rosters, and spending summaries." },
      { step: 2, name: "Team Summary", desc: "Each team shows: total spent, remaining budget, number of players, and player list sorted by sold price.", tip: "Use this to verify team composition — check no team is over budget or under minimum players." },
    ],
  },

  // ── Scheduler ──
  group_assign: {
    title: "Group Assignment",
    steps: [
      { step: 1, name: "Go to Schedule", desc: "Navigate to Sports → Schedule. Select an event from the dropdown. Click 'Setup Schedule'.", tip: "Group assignment is the first step before generating matches." },
      { step: 2, name: "Create Groups", desc: "Define groups (Group A, Group B, etc.) and assign players/teams to each group. You can drag and drop or use auto-assignment.", tip: "For balanced groups, the system can distribute players by skill rating if available." },
      { step: 3, name: "Save Groups", desc: "Click 'Save Groups'. The assignments are stored and used as the basis for generating match schedules.", tip: "Double-check group sizes — uneven groups require bye rounds which complicate scheduling." },
    ],
  },
  match_schedule: {
    title: "Schedule Matches",
    steps: [
      { step: 1, name: "Generate Schedule", desc: "After groups are assigned, click 'Generate Schedule'. The system creates a round-robin or knockout bracket based on the tournament format.", tip: "Round-robin: every team plays every other team. Knockout: single elimination." },
      { step: 2, name: "Assign Slots", desc: "Each match needs: date, time, venue, and court. Use the venue timing modal to see available slots.", tip: "The system warns about conflicts — two matches on the same court at the same time." },
      { step: 3, name: "Review & Save", desc: "Review the complete schedule. Drag matches to rearrange if needed. Click 'Save' to publish.", tip: "Once saved, the schedule is visible to all participants in the Schedule tab." },
    ],
  },
  venue_timing: {
    title: "Venue Timing Setup",
    steps: [
      { step: 1, name: "Configure Court Availability", desc: "In the schedule setup, click the venue timing icon. Set which courts are available and at what times.", tip: "Courts can have different availability — Court A might be available morning only, Court B all day." },
      { step: 2, name: "Set Time Slots", desc: "Define time slots: start time, end time, and match duration. The system calculates how many matches fit per court per day.", tip: "Include buffer time between matches (10-15 min) for transitions and delays." },
    ],
  },
  playoff_bracket: {
    title: "Playoff Bracket Generation",
    steps: [
      { step: 1, name: "Trigger Generation", desc: "After group stages are complete, click 'Generate Playoff'. Select the format: single elimination, double elimination, or custom.", tip: "The system uses group stage results to seed the bracket — top teams from each group advance." },
      { step: 2, name: "Review Bracket", desc: "A visual bracket view shows all playoff matches, seedings, and paths to the final.", tip: "The bracket is interactive — click on any match to see details or update results." },
      { step: 3, name: "Manage Matches", desc: "Update match results as they happen. The bracket automatically advances winners to the next round.", tip: "For disputed results, use the dispute committee contact info on the event page." },
    ],
  },
  match_status: {
    title: "Update Match Status",
    steps: [
      { step: 1, name: "Find the Match", desc: "Go to Schedule tab → select event → find the match in the list or bracket view.", tip: "Matches are sorted by date/time. Use the search to find specific teams." },
      { step: 2, name: "Update Status", desc: "Click the match and update its status: SCHEDULED → IN_PROGRESS → COMPLETED. Enter the score/result.", tip: "Completed matches can't be un-completed — double-check the score before confirming." },
    ],
  },
  manual_schedule: {
    title: "Manual Scheduling",
    steps: [
      { step: 1, name: "When to Use", desc: "Use manual scheduling when the auto-generated schedule doesn't fit your needs — custom formats, irregular time slots, or special arrangements.", tip: "Manual scheduling gives full control but is more time-consuming than auto-generation." },
      { step: 2, name: "Add Matches", desc: "Click 'Add Match' and configure: teams/players, date, time, venue, court, and round number.", tip: "Use bulk save to submit multiple matches at once instead of one-by-one." },
    ],
  },

  // ── Venues ──
  add_venue: {
    title: "Add a Venue",
    steps: [
      { step: 1, name: "Go to Admin Venues", desc: "Navigate to Admin → Venues. Click 'Add Venue' button.", tip: "You need admin permissions. Sports Admins can also create venues." },
      { step: 2, name: "Fill Details", desc: "Enter: Name, Address, City, Area, Pin Code, Capacity, Venue Type, Opening/Closing Times, and contact details.", tip: "The address appears on event registration pages — make it detailed enough for navigation." },
      { step: 3, name: "Add Map Link", desc: "Paste a Google Maps link so participants can get directions. The link appears as a clickable button on event pages.", tip: "Use the 'Share' link from Google Maps — not the URL bar link, which may expire." },
      { step: 4, name: "Add Courts", desc: "Define courts within the venue: Court 1, Court 2, etc. Courts are used in match scheduling.", tip: "Name courts clearly (e.g., 'Main Court', 'Practice Court') — they appear in schedule views." },
    ],
  },
  manage_courts: {
    title: "Manage Courts",
    steps: [
      { step: 1, name: "View Courts", desc: "Open a venue to see its courts listed. Each court has a name and optional details.", tip: "Courts are the scheduling unit — each match is assigned to a specific court." },
      { step: 2, name: "Add / Remove", desc: "Add new courts or remove unused ones. Removing a court that has scheduled matches will show a warning.", tip: "Don't remove courts during an active tournament — it breaks existing schedules." },
    ],
  },
  venue_map: {
    title: "Add Map Link to Venue",
    steps: [
      { step: 1, name: "Get the Link", desc: "Open Google Maps, search for the venue, and click 'Share' → 'Copy Link'.", tip: "Use the full 'goo.gl/maps' or 'maps.google.com' format — both work." },
      { step: 2, name: "Paste in Venue", desc: "Edit the venue and paste the link in the 'Map Link' field. Save.", tip: "Test the link by clicking it — make sure it opens to the correct location." },
    ],
  },

  // ── Roles & Permissions ──
  role_overview: {
    title: "Roles Overview",
    steps: [
      { step: 1, name: "Available Roles", desc: "The system has built-in roles: SUPER_ADMIN (full access), ADMIN (community admin), SPORTS_ADMIN (sports management), VENDOR, and MEMBER (regular user).", tip: "SUPER_ADMIN is the only role that can see all communities and access system-level settings." },
      { step: 2, name: "Custom Roles", desc: "Admins can create custom roles with specific permission combinations tailored to their community needs.", tip: "Custom roles are community-scoped — they don't affect other communities." },
      { step: 3, name: "Permission Categories", desc: "Permissions are grouped: Feed, Sports (Main, Auction, Teams, Player Pool, Registrations, Results), Marketplace, Jobs, Events, and Admin.", tip: "Each permission has three levels: View, Create/Edit, and Delete." },
    ],
  },
  create_role: {
    title: "Create a Custom Role",
    steps: [
      { step: 1, name: "Go to Role Management", desc: "Navigate to Admin → Roles. You'll see existing roles and their permissions.", tip: "You need 'Manage Roles' permission. Only ADMIN and SUPER_ADMIN have this by default." },
      { step: 2, name: "Create Role", desc: "Click 'Create Role'. Enter a role name (e.g., 'Tournament Organizer', 'Scorer').", tip: "Use descriptive names — other admins need to understand what the role is for." },
      { step: 3, name: "Assign Permissions", desc: "Use the permission matrix to toggle View/Create-Edit/Delete for each feature area. The matrix shows all available permissions.", tip: "Start with minimal permissions and add more as needed — it's easier to add than to remove." },
    ],
  },
  permission_matrix: {
    title: "Permission Matrix Guide",
    steps: [
      { step: 1, name: "Structure", desc: "The matrix has rows (features) and columns (View, Create/Edit, Delete). Check the boxes to grant permissions to a role.", tip: "View is required before Create/Edit — you can't edit what you can't see." },
      { step: 2, name: "Sports Permissions", desc: "Sports has sub-permissions: Main, Menu, Auction Config, Live Auction, Teams, Player Pool, Registrations, Results. Each is independently controlled.", tip: "A 'Scorer' role might only need: View Sports Main + Create/Edit Live Auction." },
      { step: 3, name: "Group Toggles", desc: "Click a group header (like 'Auction') to toggle all child permissions at once.", tip: "Use group toggles for quick setup, then fine-tune individual permissions." },
    ],
  },
  assign_role: {
    title: "Assign a Role to a User",
    steps: [
      { step: 1, name: "Go to User Management", desc: "Navigate to Admin Dashboard → User list. Find the user you want to modify.", tip: "Use the search bar to find users by name or email." },
      { step: 2, name: "Change Role", desc: "Click on the user → 'Change Role'. Select the new role from the dropdown. Click Save.", tip: "Only ADMIN and SUPER_ADMIN can change roles. SUPER_ADMIN role changes require SUPER_ADMIN access." },
      { step: 3, name: "Verify", desc: "The user's permissions update immediately. They may need to refresh their browser to see new menu items.", tip: "Tell the user to log out and back in if their sidebar doesn't update." },
    ],
  },

  // ── Admin ──
  admin_overview: {
    title: "Admin Dashboard Guide",
    steps: [
      { step: 1, name: "Access", desc: "Click 'Admin Dashboard' in the sidebar. You need 'View Admin' permission.", tip: "The admin dashboard is the central hub for community management." },
      { step: 2, name: "Key Sections", desc: "User Management (create, edit, bulk upload), Venues, Community Settings, Role Management, Logs, and Audit Trail.", tip: "Each section is a separate page accessible from the admin sub-navigation." },
    ],
  },
  create_user: {
    title: "Create a User (Admin)",
    steps: [
      { step: 1, name: "Go to Create User", desc: "Admin → Create User. Fill in: full name, email, phone, flat number, block, and select a role.", tip: "The user will receive a welcome email/SMS with login instructions." },
      { step: 2, name: "Set Community", desc: "The user is automatically assigned to YOUR community (unless you're a Super Admin, in which case you choose).", tip: "Users can only belong to one community. Transferring requires admin action." },
      { step: 3, name: "Save", desc: "Click 'Create'. The account is active immediately. The user can log in with the email/phone and a default password (or OTP).", tip: "Remind the user to change their default password on first login." },
    ],
  },
  bulk_upload: {
    title: "Bulk User Upload",
    steps: [
      { step: 1, name: "Prepare CSV", desc: "Create a CSV with: fullName, email, phone, flatNo, block, role. One user per row.", tip: "Download the template from Admin → Bulk Upload for the exact format." },
      { step: 2, name: "Upload", desc: "Go to Admin → Bulk Upload. Select your CSV file and click Upload.", tip: "Large files (500+ users) take a few seconds. The progress indicator shows completion status." },
      { step: 3, name: "Review", desc: "The upload result shows imported count and any failed rows with reasons (duplicate email, invalid phone, etc.).", tip: "Fix failed rows and upload a new CSV with just those entries." },
    ],
  },
  manage_users: {
    title: "Manage Users",
    steps: [
      { step: 1, name: "User List", desc: "Admin Dashboard shows all users in your community with: name, email, role, status, and KYC status.", tip: "The list is paginated — use search to find specific users quickly." },
      { step: 2, name: "Search & Filter", desc: "Search by name, email, or phone. Filter by role, status (active/disabled), or KYC status.", tip: "Export the user list for offline review if needed." },
    ],
  },
  toggle_status: {
    title: "Enable / Disable Users",
    steps: [
      { step: 1, name: "Find User", desc: "In the admin user list, find the user you want to enable or disable.", tip: "Disabling a user prevents them from logging in without deleting their data." },
      { step: 2, name: "Toggle Status", desc: "Click the enable/disable toggle. Disabled users are immediately logged out and cannot log back in.", tip: "Use disable instead of delete — it preserves registration history and audit trails." },
    ],
  },
  community_create: {
    title: "Create a Community",
    steps: [
      { step: 1, name: "Go to Community", desc: "Navigate to Admin → Create Community. This is a Super Admin or 'Manage Communities' permission feature.", tip: "Each community is isolated — users, events, and data are community-scoped." },
      { step: 2, name: "Fill Details", desc: "Enter: Community Name and any additional details. The community gets a unique ID.", tip: "Choose a clear, recognizable name — users see this in their profile and event pages." },
      { step: 3, name: "Save", desc: "Click Create. The community is ready. Users can be assigned to it via user creation or bulk upload.", tip: "After creation, create an admin user for the community so they can self-manage." },
    ],
  },
  audit_logs: {
    title: "View Audit Logs",
    steps: [
      { step: 1, name: "Access", desc: "Navigate to Admin → Audit Trail. This is Super Admin only — it shows a complete activity log.", tip: "Audit logs are immutable — they can't be edited or deleted." },
      { step: 2, name: "Filter & Search", desc: "Filter by: module (Sports, Admin, Auth), action (CREATE, UPDATE, DELETE), user, and date range.", tip: "Use audit logs to investigate security incidents or track who made specific changes." },
      { step: 3, name: "Details", desc: "Each log entry shows: timestamp, user, action, module, entity, and before/after values for changes.", tip: "The 'before/after' comparison is useful for understanding exactly what changed." },
    ],
  },
  session_monitor: {
    title: "Session Monitoring",
    steps: [
      { step: 1, name: "Access", desc: "Super Admin can view active sessions in the admin dashboard — shows who's logged in, from which device and browser.", tip: "Session monitoring helps detect unauthorized access or shared accounts." },
      { step: 2, name: "Details", desc: "Each session shows: user ID, IP address, device type, browser, login time, and last activity.", tip: "Compare IP addresses — unusual locations may indicate compromised accounts." },
    ],
  },
  system_logs: {
    title: "System Logs",
    steps: [
      { step: 1, name: "Access", desc: "Admin → Logs. View application logs for debugging and monitoring.", tip: "System logs include security events, API errors, and performance warnings." },
      { step: 2, name: "Filter", desc: "Filter by log level (INFO, WARN, ERROR), date range, and search text.", tip: "Focus on ERROR and WARN levels when investigating issues." },
    ],
  },

  // ── Marketplace ──
  browse_listings: {
    title: "Browse Marketplace Listings",
    steps: [
      { step: 1, name: "Open Marketplace", desc: "Click 'Marketplace' in the sidebar. You'll see available listings from your community.", tip: "Listings are community-scoped — you see items from your community members only." },
      { step: 2, name: "Browse", desc: "Scroll through listings or use search to find specific items. Each listing shows: title, price, description, and seller.", tip: "Contact the seller directly via chat for questions or negotiations." },
    ],
  },
  create_listing: {
    title: "Create a Marketplace Listing",
    steps: [
      { step: 1, name: "Click Create", desc: "In the Marketplace, click 'Create Listing'. Fill in: title, description, price, and category.", tip: "You need 'Create Listing' permission. Members have this by default." },
      { step: 2, name: "Publish", desc: "Click 'Post Listing'. It's visible to all community members immediately.", tip: "Include clear photos and honest descriptions for faster sales." },
    ],
  },
  listing_rules: {
    title: "Marketplace Listing Guidelines",
    steps: [
      { step: 1, name: "Allowed Items", desc: "Household goods, furniture, electronics, books, and community services. No prohibited items (weapons, illegal goods, etc.).", tip: "If in doubt, ask your community admin before listing." },
      { step: 2, name: "Fair Pricing", desc: "Price items fairly based on condition. Include any defects in the description.", tip: "Clearly state if the price is negotiable." },
    ],
  },

  // ── Jobs ──
  post_job: {
    title: "Post a Job",
    steps: [
      { step: 1, name: "Open Jobs", desc: "Click 'Jobs & Referrals' in the sidebar. Click 'Post a Job'.", tip: "You need 'Create Job' permission." },
      { step: 2, name: "Fill Details", desc: "Enter: job title, company, description, requirements, location, and salary range.", tip: "Be specific about requirements — it reduces unqualified applications." },
      { step: 3, name: "Publish", desc: "Click 'Post'. The job is visible to all community members.", tip: "Share the job in the community feed for more visibility." },
    ],
  },
  apply_job: {
    title: "Apply for a Job",
    steps: [
      { step: 1, name: "Browse Jobs", desc: "Go to Jobs & Referrals. Browse available positions or search by keyword.", tip: "Jobs are from your community members — networking advantage!" },
      { step: 2, name: "Apply", desc: "Click on a job listing and hit 'Apply'. Follow the instructions provided by the poster.", tip: "Mention you're a community member — it adds trust to your application." },
    ],
  },
  referral_program: {
    title: "Referral Program",
    steps: [
      { step: 1, name: "How It Works", desc: "Refer community members to job openings. If they get hired, you may earn a referral bonus (set by the job poster).", tip: "Referrals have a higher success rate than cold applications." },
      { step: 2, name: "Make a Referral", desc: "On any job listing, click 'Refer Someone' and select a community member. They'll be notified about the opportunity.", tip: "Only refer people you know are qualified — your reputation is on the line." },
    ],
  },
  edit_job: {
    title: "Edit / Close a Job Posting",
    steps: [
      { step: 1, name: "Find Your Job", desc: "Go to Jobs & Referrals. Your posted jobs appear with an 'Edit' icon. Click it to modify the listing.", tip: "Only the job creator and admins can edit/close a job posting." },
      { step: 2, name: "Edit Details", desc: "Update any field — title, description, requirements, salary, or location. Click 'Save' to apply changes immediately.", tip: "If you change requirements, consider notifying existing applicants." },
      { step: 3, name: "Close the Posting", desc: "Click 'Close Job' to stop accepting applications. The listing remains visible as 'Closed' but no new applications are accepted.", tip: "Close the posting once you've filled the position to avoid unnecessary applications." },
    ],
  },
  search_jobs: {
    title: "Search & Filter Jobs",
    steps: [
      { step: 1, name: "Open Jobs Page", desc: "Navigate to Jobs & Referrals from the sidebar. All available jobs in your community are listed.", tip: "Jobs are community-scoped — you only see postings from your community members." },
      { step: 2, name: "Search by Keyword", desc: "Use the search bar to find jobs by title, company name, or skills. Results update as you type.", tip: "Try broad keywords first (e.g., 'developer') then narrow down if too many results." },
      { step: 3, name: "Apply Filters", desc: "Filter by job type, location, salary range, or posting date. Combine multiple filters to narrow results.", tip: "Save your filter preferences if you check jobs regularly." },
    ],
  },
  view_applications: {
    title: "View Applications (Job Poster)",
    steps: [
      { step: 1, name: "Open Your Posting", desc: "Go to Jobs & Referrals → find your job listing. Click to open details — you'll see an 'Applications' tab or count.", tip: "You receive a notification each time someone applies to your job." },
      { step: 2, name: "Review Applicants", desc: "Each application shows the applicant's name, profile details, and any message they included. Review their community profile for more context.", tip: "Community members have verified profiles — KYC-verified applicants are more trustworthy." },
      { step: 3, name: "Respond", desc: "Contact promising applicants directly via community chat. You can also mark applications as 'Reviewed', 'Shortlisted', or 'Rejected'.", tip: "Respond promptly — it builds your reputation as a job poster in the community." },
    ],
  },

  // ── Marketplace (new flows) ──
  edit_listing: {
    title: "Edit / Delete a Marketplace Listing",
    steps: [
      { step: 1, name: "Find Your Listing", desc: "Go to Marketplace. Your own listings have an 'Edit' and 'Delete' option visible on the listing card.", tip: "Only the listing creator and community admins can edit or delete listings." },
      { step: 2, name: "Edit Listing", desc: "Click 'Edit' to update the title, price, description, or photos. Changes are reflected immediately after saving.", tip: "If you've lowered the price, update the description to mention it — it attracts more buyers." },
      { step: 3, name: "Delete Listing", desc: "Click 'Delete' and confirm. The listing is permanently removed from the marketplace.", tip: "Consider marking as 'Sold' instead of deleting if the item was purchased — it helps track community activity." },
    ],
  },
  contact_seller: {
    title: "Contact a Seller",
    steps: [
      { step: 1, name: "Find the Listing", desc: "Browse or search the marketplace to find an item you're interested in. Click on it to see full details.", tip: "Check the listing date — older listings may already be sold." },
      { step: 2, name: "Message Seller", desc: "Click the 'Contact Seller' or 'Chat' button on the listing. This opens a direct message with the seller.", tip: "Introduce yourself and mention which listing you're interested in — sellers may have multiple items." },
      { step: 3, name: "Negotiate & Arrange", desc: "Discuss price, condition, and pickup/delivery details via chat. Agree on terms before meeting.", tip: "Meet in a common area of your community for safety. Avoid sharing personal address details." },
    ],
  },
  search_marketplace: {
    title: "Search & Filter Marketplace",
    steps: [
      { step: 1, name: "Open Marketplace", desc: "Click 'Marketplace' in the sidebar. All active listings from your community are displayed.", tip: "Listings are sorted by newest first by default." },
      { step: 2, name: "Search Items", desc: "Use the search bar to find items by name or keyword. Results filter in real-time as you type.", tip: "Try different keywords — 'sofa' vs 'couch' may show different results." },
      { step: 3, name: "Filter by Category", desc: "Use category filters (Electronics, Furniture, Books, etc.) to narrow down listings. Combine with price range if available.", tip: "Check back regularly — new items are posted daily in active communities." },
    ],
  },

  // ── Finance & Billing ──
  finance_overview: {
    title: "Finance Dashboard Overview",
    steps: [
      { step: 1, name: "Access Finance", desc: "Click 'Finance' in the sidebar navigation. You'll see sub-sections: Expenses, Invoices, Budget, and Reports.", tip: "You need 'View Admin' permission to access the finance module." },
      { step: 2, name: "Expenses Tab", desc: "View all community expenses — pending approvals, approved expenses, and rejected ones. Each shows amount, category, creator, and status.", tip: "Expenses are community-scoped — you only see expenses from your own community." },
      { step: 3, name: "Invoices Tab", desc: "View generated invoices with GST breakdown (CGST + SGST). Track payment status — PAID, UNPAID, OVERDUE, or PARTIAL.", tip: "Invoices are auto-generated when an expense is approved and split among active residents." },
      { step: 4, name: "Stats Cards", desc: "At the top, summary cards show: Total Expenses, Approved Amount, Pending Count, Outstanding Invoices, and Collected Amount.", tip: "Click on any stat card to filter the table below to that specific status." },
    ],
  },
  create_expense: {
    title: "Create an Expense",
    steps: [
      { step: 1, name: "Open Expense Form", desc: "Go to Finance → Expenses. Click the '+ Create Expense' button. A modal form opens.", tip: "You need admin permissions to create expenses." },
      { step: 2, name: "Fill Details", desc: "Enter: Title (e.g., 'Monthly Maintenance'), Amount, Category (Maintenance, Utilities, Events, etc.), and an optional Description.", tip: "Be specific with the title — it appears on resident invoices." },
      { step: 3, name: "GST Preview", desc: "As you enter the amount, a real-time GST preview shows: Taxable Amount, CGST (9%), SGST (9%), and Total Amount (118% of base).", tip: "GST is calculated at 18% total — split equally as 9% CGST and 9% SGST per Indian tax rules." },
      { step: 4, name: "Attach Receipt", desc: "Optionally upload a receipt file (PDF, JPG, PNG). This is stored for audit purposes and visible in expense details.", tip: "Always attach receipts for expenses above ₹5,000 — it speeds up approval." },
      { step: 5, name: "Submit", desc: "Click 'Submit'. The expense is created in PENDING status. An admin must approve it before invoices are generated.", tip: "Submitted expenses trigger a notification to all users with admin permissions." },
    ],
  },
  approve_expense: {
    title: "Approve / Reject an Expense",
    steps: [
      { step: 1, name: "View Pending Expenses", desc: "Go to Finance → Expenses. Filter by 'Pending' status to see expenses awaiting approval.", tip: "The pending count badge on the Finance menu shows how many expenses need action." },
      { step: 2, name: "Review Details", desc: "Click on an expense to see full details: title, amount, GST breakdown, category, description, receipt, and who created it.", tip: "Check the receipt attachment matches the claimed amount before approving." },
      { step: 3, name: "Approve", desc: "Click 'Approve'. The expense status changes to APPROVED. Invoice generation starts automatically in the background — each active resident gets an individual invoice.", tip: "Approval triggers async batch invoice generation. For 100 residents, invoices are generated within seconds." },
      { step: 4, name: "Reject", desc: "Click 'Reject' to decline the expense. The status changes to REJECTED. The creator is notified.", tip: "Add a reason when rejecting so the creator can fix the issue and re-submit." },
    ],
  },
  invoice_management: {
    title: "Invoice Management",
    steps: [
      { step: 1, name: "View All Invoices", desc: "Go to Finance → Invoices. See all community invoices with columns: Invoice #, Resident, Flat No, Amount, CGST, SGST, Total, Due Date, Status.", tip: "Invoices are auto-generated when an expense is approved — each resident gets their share." },
      { step: 2, name: "Invoice Details", desc: "Click an invoice to see full breakdown: taxable amount, CGST (9%), SGST (9%), total amount, linked expense title, and payment history.", tip: "The invoice number is unique and follows the format INV-YYYYMMDD-XXXX." },
      { step: 3, name: "Filter by Status", desc: "Filter invoices by: PAID, UNPAID, OVERDUE, or PARTIAL. Use this to chase outstanding payments.", tip: "OVERDUE invoices are those past their due date (30 days from generation by default)." },
      { step: 4, name: "Mark as Paid", desc: "When a resident pays, click 'Mark as Paid'. The status changes to PAID with a timestamp. The outstanding balance updates.", tip: "For partial payments, the status can be set to PARTIAL until the full amount is received." },
      { step: 5, name: "My Invoices (Resident View)", desc: "Regular residents can view their own invoices at Finance → Invoices → 'My Invoices' tab. They see only invoices addressed to them.", tip: "Residents don't need admin permissions to view their own invoices." },
    ],
  },
  gst_breakdown: {
    title: "GST Preview & Breakdown",
    steps: [
      { step: 1, name: "What Is GST", desc: "GST (Goods and Services Tax) is an Indian tax applied at 18% on community expenses. It's split into CGST (Central GST: 9%) and SGST (State GST: 9%).", tip: "This is the standard GST rate for community maintenance and service charges in India." },
      { step: 2, name: "How It's Calculated", desc: "For an expense of ₹10,000: Taxable = ₹10,000, CGST = ₹900, SGST = ₹900, Total = ₹11,800. Each resident's invoice shows their proportional share.", tip: "The amount per resident = Total ÷ Number of Active Residents." },
      { step: 3, name: "Preview Before Submitting", desc: "When creating an expense, enter the amount and the GST preview updates in real-time. Use the /billing/gst-preview API endpoint for programmatic access.", tip: "The preview helps you verify the total before submission — no surprises for residents." },
    ],
  },
  budget_planning: {
    title: "Budget Planning",
    steps: [
      { step: 1, name: "Access Budget", desc: "Navigate to Finance → Budget. The budget dashboard shows your community's financial planning overview.", tip: "You need 'View Admin' permission to access the budget section." },
      { step: 2, name: "View Allocations", desc: "See budget allocations by category: Maintenance, Utilities, Events, Staff, Miscellaneous. Each shows allocated vs spent amounts.", tip: "Categories match the expense categories — spending is tracked automatically." },
      { step: 3, name: "Set Budget Limits", desc: "Define monthly or quarterly budget limits for each category. The system warns when spending approaches the limit.", tip: "Set realistic limits based on previous months' actuals. Review and adjust quarterly." },
      { step: 4, name: "Budget vs Actual", desc: "Compare budgeted amounts with actual spending. Variance reports highlight overspending and underspending by category.", tip: "Large variances may indicate either poor budgeting or unexpected expenses — investigate both." },
    ],
  },
  financial_reports: {
    title: "Financial Reports",
    steps: [
      { step: 1, name: "Access Reports", desc: "Navigate to Finance → Reports. Choose from available report types: Monthly Summary, Category Breakdown, and Collection Report.", tip: "Reports are generated on-demand with the latest data — no need to refresh." },
      { step: 2, name: "Monthly Summary", desc: "Shows total expenses, total invoices generated, amount collected, and amount outstanding for a selected month.", tip: "Compare month-over-month to spot trends in community spending." },
      { step: 3, name: "Category Breakdown", desc: "Pie chart and table showing spending by category. Useful for identifying where the community's money is going.", tip: "Present this report in community meetings for transparency." },
      { step: 4, name: "Collection Report", desc: "Shows invoice payment rates: how many residents have paid, how many are overdue, and total outstanding amount.", tip: "Use this to follow up with residents who have outstanding invoices." },
    ],
  },
  ledger_guide: {
    title: "Ledger & Accounts",
    steps: [
      { step: 1, name: "Access Ledger", desc: "Navigate to Finance → Ledger. The ledger provides a detailed view of all financial transactions in chronological order.", tip: "The ledger is the single source of truth for all community financial data." },
      { step: 2, name: "Transaction View", desc: "Each entry shows: date, description, debit/credit amount, balance, and linked expense or invoice reference.", tip: "Click on any entry to see the original expense or invoice it relates to." },
      { step: 3, name: "Filter & Search", desc: "Filter by date range, transaction type (expense, payment, adjustment), or search by description keyword.", tip: "Export the ledger as CSV for your accountant or auditor." },
    ],
  },

  // ── Inventory ──
  inventory_dashboard: {
    title: "Inventory Dashboard",
    steps: [
      { step: 1, name: "Access Inventory", desc: "Click 'Inventory' in the sidebar or navigate to Community → Inventory. The dashboard shows all community inventory items.", tip: "Inventory is community-scoped — you only see items belonging to your community." },
      { step: 2, name: "Overview Cards", desc: "Stat cards show: Total Items, Low Stock Items, Recently Added, and Items Due for Audit. Each is clickable to filter.", tip: "Check 'Low Stock' regularly to avoid running out of essential supplies." },
      { step: 3, name: "Item List", desc: "A table shows all items: name, category, quantity, unit, location, last updated, and status. Sort by any column.", tip: "Items with red indicators are below minimum stock levels and need reordering." },
    ],
  },
  add_inventory: {
    title: "Add / Edit Inventory Items",
    steps: [
      { step: 1, name: "Add New Item", desc: "In the Inventory Dashboard, click '+ Add Item'. Enter: item name, category, quantity, unit (pcs, kg, liters), location, and minimum stock level.", tip: "Set a realistic minimum stock level — the system alerts you when stock drops below this." },
      { step: 2, name: "Set Category", desc: "Choose a category: Cleaning Supplies, Electrical, Plumbing, Sports Equipment, Office Supplies, or create a custom one.", tip: "Consistent categorization helps in generating useful inventory reports." },
      { step: 3, name: "Edit Existing Item", desc: "Click the 'Edit' icon on any item to update its details. Changes are logged in the audit trail.", tip: "When adjusting quantity, add a note explaining why (e.g., 'used for Diwali event')." },
      { step: 4, name: "Save", desc: "Click 'Save' to create or update the item. It appears immediately in the inventory list.", tip: "New items start with the quantity you enter — use stock adjustments for subsequent changes." },
    ],
  },
  stock_tracking: {
    title: "Stock Level Tracking",
    steps: [
      { step: 1, name: "View Stock Levels", desc: "The inventory dashboard shows current stock for each item with a visual indicator: green (OK), yellow (low), red (critical).", tip: "Critical stock means quantity is at or below the minimum level." },
      { step: 2, name: "Adjust Stock", desc: "Click an item → 'Adjust Stock'. Enter the new quantity and reason (received delivery, consumed, damaged, etc.).", tip: "Always provide a reason for stock adjustments — it's used for audit compliance." },
      { step: 3, name: "Stock History", desc: "Each item has a history tab showing all stock changes: date, previous quantity, new quantity, adjusted by, and reason.", tip: "Review stock history to spot patterns — frequent adjustments may indicate waste or theft." },
    ],
  },
  inventory_management: {
    title: "Inventory Management (Advanced)",
    steps: [
      { step: 1, name: "Access Management View", desc: "Navigate to Community → Inventory Management. This provides advanced tools beyond the basic dashboard.", tip: "This view is designed for community managers who handle procurement and asset tracking." },
      { step: 2, name: "Bulk Operations", desc: "Select multiple items for bulk actions: update category, adjust stock levels, or export to CSV.", tip: "Use bulk operations when receiving a large delivery — faster than updating items one by one." },
      { step: 3, name: "Reorder Alerts", desc: "Configure automatic alerts when items fall below minimum stock. Notifications are sent to designated admin users.", tip: "Link reorder alerts to the procurement module for a seamless restock workflow." },
      { step: 4, name: "Reports", desc: "Generate inventory reports: stock valuation, consumption trends, and category-wise summaries.", tip: "Run monthly inventory reports for community committee reviews." },
    ],
  },
  inventory_search: {
    title: "Search & Filter Inventory",
    steps: [
      { step: 1, name: "Search Bar", desc: "Use the search bar at the top of the inventory dashboard to find items by name or description.", tip: "Search matches partial words — typing 'bulb' will find 'LED Bulb 9W' and 'Bulb Holder'." },
      { step: 2, name: "Category Filter", desc: "Click a category chip to filter by type: Cleaning, Electrical, Plumbing, etc. Combine with search for precise results.", tip: "Click the active filter again to deselect it and show all items." },
      { step: 3, name: "Sort Options", desc: "Sort the list by: name, quantity (ascending/descending), last updated, or category.", tip: "Sort by quantity ascending to quickly find items that need restocking." },
    ],
  },

  // ── Assets ──
  asset_checkout: {
    title: "Asset Checkout Flow",
    steps: [
      { step: 1, name: "Browse Assets", desc: "Navigate to the assets page or access an item directly via a shared link (/items/:id). You'll see the asset details, availability, and checkout options.", tip: "Assets include community equipment: projectors, sports gear, event supplies, etc." },
      { step: 2, name: "Request Checkout", desc: "Click 'Checkout' on an available asset. Select the date range you need it for and add a purpose note.", tip: "Some assets require admin approval before checkout is confirmed." },
      { step: 3, name: "Confirmation", desc: "If auto-approved, the asset is marked as checked out to you. If approval-required, you'll see a 'Pending' status until an admin confirms.", tip: "Return assets on time — late returns may affect your ability to check out future items." },
      { step: 4, name: "Return Asset", desc: "When done, go to your active checkouts and click 'Return'. The asset becomes available for others.", tip: "Note any damage or issues during return — it helps maintain the community's assets." },
    ],
  },
  expense_upload: {
    title: "Upload Expense Receipts",
    steps: [
      { step: 1, name: "Access Upload", desc: "Go to the expense creation form or the expense details page. Look for the 'Upload Receipt' or 'Attach File' button.", tip: "Supported formats: PDF, JPG, PNG. Maximum file size is 5MB." },
      { step: 2, name: "Select File", desc: "Click the upload button and select your receipt file from your device. A preview is shown before submission.", tip: "Take a clear photo of paper receipts — blurry images make verification difficult." },
      { step: 3, name: "Submit", desc: "The receipt is uploaded and linked to the expense. Admins can view it when reviewing the expense for approval.", tip: "Receipts are stored securely and accessible only to community admins and the uploader." },
    ],
  },
  treasurer_queue: {
    title: "Treasurer Approval Queue",
    steps: [
      { step: 1, name: "Access Queue", desc: "Treasurers see a dedicated approval queue showing all expenses awaiting financial approval. Navigate via the Admin or Finance section.", tip: "The treasurer queue is separate from general admin approvals — it focuses on financial items." },
      { step: 2, name: "Review Items", desc: "Each queue item shows: expense title, amount, GST breakdown, category, creator, receipt attachment, and submission date.", tip: "Review receipts carefully — verify the amount on the receipt matches the claimed amount." },
      { step: 3, name: "Approve or Return", desc: "Approve to trigger invoice generation, or return with comments for the creator to revise.", tip: "Returned items go back to the creator's draft — they can edit and resubmit." },
    ],
  },

  // ── Community Operations ──
  procurement_dashboard: {
    title: "Procurement Dashboard",
    steps: [
      { step: 1, name: "Access Procurement", desc: "Navigate to Community → Procurement. The dashboard shows all procurement requests and their statuses.", tip: "Procurement covers purchasing supplies, services, and equipment for the community." },
      { step: 2, name: "View Requests", desc: "Each request shows: item/service description, estimated cost, urgency, requested by, date, and status (Draft, Submitted, Approved, Ordered, Received).", tip: "Filter by status to focus on actionable items — 'Submitted' needs your review." },
      { step: 3, name: "Procurement Workflow", desc: "The typical flow: Draft → Submitted → Approved → Ordered → Received. Each step is tracked with timestamps and user details.", tip: "Link procurement requests to inventory items for automatic stock updates when items are received." },
    ],
  },
  raise_procurement: {
    title: "Raise a Procurement Request",
    steps: [
      { step: 1, name: "Click New Request", desc: "In the Procurement Dashboard, click '+ New Request'. A form opens for the procurement details.", tip: "Check existing inventory first — the item you need might already be in stock." },
      { step: 2, name: "Fill Details", desc: "Enter: item/service name, description, estimated quantity, estimated cost, urgency (Low/Medium/High), and preferred vendor (optional).", tip: "Add vendor quotes as attachments if you've already sourced pricing." },
      { step: 3, name: "Submit", desc: "Click 'Submit'. The request goes to the community admin/treasurer for approval. You'll be notified when it's approved.", tip: "High-urgency requests are highlighted in the admin's queue for faster processing." },
    ],
  },
  maintenance_dashboard: {
    title: "Maintenance Dashboard",
    steps: [
      { step: 1, name: "Access Maintenance", desc: "Navigate to Community → Maintenance. The dashboard shows all maintenance requests with status indicators.", tip: "Both residents and admins can view the dashboard — residents see their own requests, admins see all." },
      { step: 2, name: "Overview", desc: "Stat cards show: Open Tickets, In Progress, Resolved Today, and Average Resolution Time. Below is the full ticket list.", tip: "Click on any stat card to filter the ticket list to that status." },
      { step: 3, name: "Ticket Details", desc: "Each ticket shows: issue description, location (Block/Flat/Common Area), priority, reported by, assigned to, and status history.", tip: "Photos attached to tickets help maintenance staff understand the issue before visiting." },
    ],
  },
  raise_maintenance: {
    title: "Raise a Maintenance Ticket",
    steps: [
      { step: 1, name: "Click New Ticket", desc: "In the Maintenance Dashboard, click '+ New Ticket'. Fill in the issue details.", tip: "Any community member can raise a maintenance ticket — no special permissions needed." },
      { step: 2, name: "Describe the Issue", desc: "Enter: title, detailed description, location (select block, flat, or common area), and priority (Low/Medium/High/Urgent).", tip: "Be specific — 'Leaking pipe in Block A, 3rd floor corridor near lift' is better than 'Water leak'." },
      { step: 3, name: "Attach Photos", desc: "Upload photos of the issue. Multiple images can be attached for complex problems.", tip: "Take photos from different angles and include close-ups of the damage or issue." },
      { step: 4, name: "Submit", desc: "Click 'Submit'. The ticket is created and assigned to the maintenance team. You'll receive updates as the status changes.", tip: "For urgent issues (broken elevator, water main burst), also call the community helpline directly." },
    ],
  },
  asset_audit: {
    title: "Asset Audit Trail",
    steps: [
      { step: 1, name: "Access Audit", desc: "Navigate to Community → Audit. This shows a comprehensive log of all asset-related activities.", tip: "Only admins can access the asset audit trail — it's designed for compliance and accountability." },
      { step: 2, name: "Audit Log", desc: "Each entry shows: timestamp, asset name, action (Added, Modified, Checked Out, Returned, Disposed), performed by, and details.", tip: "Use date filters to narrow down to a specific period for auditing." },
      { step: 3, name: "Run an Audit", desc: "Click 'Start Audit' to begin a physical verification. The system generates a checklist of all assets for you to verify against actual items.", tip: "Schedule quarterly audits — they help catch discrepancies early." },
      { step: 4, name: "Audit Report", desc: "After completing verification, generate an audit report showing: verified items, missing items, damaged items, and discrepancies.", tip: "Share the audit report with the community committee for review and action." },
    ],
  },
  community_settings: {
    title: "Community Settings",
    steps: [
      { step: 1, name: "Access Settings", desc: "Go to Admin → Community Settings. This page lets you configure community-level preferences and metadata.", tip: "Only community admins and super admins can modify community settings." },
      { step: 2, name: "Basic Info", desc: "Update community name, description, address, contact details, and logo. These appear on event pages and invoices.", tip: "Keep the community name consistent — it appears on all official documents." },
      { step: 3, name: "Feature Toggles", desc: "Enable or disable modules for your community: Marketplace, Jobs, Sports, Finance. Disabled modules are hidden from all users.", tip: "Disable unused modules to simplify the navigation for your community members." },
    ],
  },

  // ── Sports Analytics ──
  analytics_dashboard: {
    title: "Sports Analytics Dashboard",
    steps: [
      { step: 1, name: "Access Analytics", desc: "Navigate to Sports → Analytics tab. The dashboard shows visual summaries of your community's sports activity.", tip: "You need 'View Sports Menu' permission to access analytics." },
      { step: 2, name: "Key Metrics", desc: "Stat cards show: Total Events Conducted, Total Participants, Average Participation Rate, and Active Players (last 6 months).", tip: "Compare metrics across seasons to measure community engagement growth." },
      { step: 3, name: "Charts", desc: "Interactive charts show: participation by sport, monthly event trends, registration conversion rates, and top players by appearances.", tip: "Hover over chart elements for detailed tooltips with exact numbers." },
    ],
  },
  participation_trends: {
    title: "Participation Trends",
    steps: [
      { step: 1, name: "View Trends", desc: "In the Analytics dashboard, the 'Participation Trends' section shows month-over-month registration and attendance data.", tip: "Rising trends indicate growing community interest — capitalize with more events." },
      { step: 2, name: "Sport Breakdown", desc: "See which sports are most popular: cricket, football, badminton, etc. Bar charts compare participation across sports.", tip: "Use this data to decide which sports to invest in for next season." },
      { step: 3, name: "Demographics", desc: "Age group and gender distribution charts show who's participating. Useful for planning inclusive events.", tip: "Low participation from a demographic? Consider dedicated events or categories for that group." },
    ],
  },
  event_reports: {
    title: "Event-Specific Reports",
    steps: [
      { step: 1, name: "Select Event", desc: "In Analytics, use the event dropdown to select a specific event. The report loads with that event's complete data.", tip: "Completed events have the most comprehensive data — in-progress events show partial stats." },
      { step: 2, name: "Registration Stats", desc: "See: total registrations, approval rate, withdrawal rate, category-wise distribution, and registration timeline.", tip: "High withdrawal rates may indicate scheduling conflicts or better alternative events." },
      { step: 3, name: "Auction Summary", desc: "If the event had an auction: total money spent, average player price, most expensive player, team spending comparison.", tip: "Compare auction summaries across seasons to see how player valuations change." },
      { step: 4, name: "Match Results", desc: "Complete match results, win/loss records, top scorers, and tournament bracket history.", tip: "These results persist permanently — great for settling future debates about past tournaments!" },
    ],
  },
  export_analytics: {
    title: "Export Analytics Data",
    steps: [
      { step: 1, name: "Choose Format", desc: "In the Analytics dashboard, click 'Export'. Choose your format: CSV (data), PDF (formatted report), or Excel.", tip: "CSV is best for further analysis in spreadsheet tools. PDF is best for sharing with committee members." },
      { step: 2, name: "Select Date Range", desc: "Choose the period to export: last month, last quarter, last year, or custom date range.", tip: "Quarterly exports work well for committee meeting presentations." },
      { step: 3, name: "Download", desc: "Click 'Download'. The file is generated and saved to your device. Large exports may take a few seconds.", tip: "For committee meetings, export as PDF — it includes charts and formatting ready for presentation." },
    ],
  },

};

// ─── Keyword → flow matching for freeform questions ─────────────────────────

const KEYWORD_FLOW_MAP: { keywords: string[]; module: string; flow: string }[] = [
  { keywords: ["login", "log in", "sign in", "signin"], module: "auth", flow: "login" },
  { keywords: ["sign up", "signup", "create account", "register account", "new account"], module: "auth", flow: "signup" },
  { keywords: ["forgot password", "reset password", "lost password", "change password"], module: "auth", flow: "forgot_password" },
  { keywords: ["otp", "verification code", "code not received"], module: "auth", flow: "otp_trouble" },
  { keywords: ["kyc", "identity", "id verification", "aadhaar"], module: "auth", flow: "kyc" },
  { keywords: ["session", "timeout", "logged out", "expired"], module: "auth", flow: "session_timeout" },
  { keywords: ["create post", "write post", "new post", "share update"], module: "feed", flow: "create_post" },
  { keywords: ["comment", "reply to post"], module: "feed", flow: "comment_post" },
  { keywords: ["delete post", "remove post"], module: "feed", flow: "delete_post" },
  { keywords: ["community guidelines", "rules", "posting rules"], module: "feed", flow: "community_guidelines" },
  { keywords: ["direct message", "dm", "send message", "private message", "start chat"], module: "chat", flow: "start_dm" },
  { keywords: ["group chat", "group message"], module: "chat", flow: "group_chat" },
  { keywords: ["notification type", "what notifications", "alert type"], module: "notifications", flow: "notif_types" },
  { keywords: ["mark read", "dismiss notification", "clear notification"], module: "notifications", flow: "mark_read" },
  { keywords: ["edit profile", "update profile", "change name", "my profile"], module: "profile", flow: "edit_profile" },
  { keywords: ["profile picture", "avatar", "photo", "profile photo"], module: "profile", flow: "profile_picture" },
  { keywords: ["register event", "sign up event", "join event", "register sport", "participate"], module: "registration", flow: "self_register" },
  { keywords: ["registration status", "pending", "confirmed", "rejected", "approved"], module: "registration", flow: "reg_statuses" },
  { keywords: ["withdraw", "cancel registration", "unregister"], module: "registration", flow: "withdraw_reg" },
  { keywords: ["captain", "nominate captain", "team captain"], module: "registration", flow: "captain_nominate" },
  { keywords: ["approve registration", "reject registration", "admin approve"], module: "registration", flow: "admin_approve" },
  { keywords: ["bulk import", "csv import", "upload csv", "import players"], module: "registration", flow: "bulk_import" },
  { keywords: ["create event", "new event", "organize event", "add event"], module: "events", flow: "create_event" },
  { keywords: ["event status", "event lifecycle", "draft", "live", "completed"], module: "events", flow: "event_lifecycle" },
  { keywords: ["share event", "event link", "uuid link", "share link"], module: "events", flow: "share_event" },
  { keywords: ["sponsor", "add sponsor", "event sponsor"], module: "events", flow: "event_sponsors" },
  { keywords: ["venue", "add venue", "create venue", "new venue"], module: "venues", flow: "add_venue" },
  { keywords: ["court", "manage court", "add court"], module: "venues", flow: "manage_courts" },
  { keywords: ["map link", "google maps", "directions"], module: "venues", flow: "venue_map" },
  { keywords: ["auction setup", "auction config", "create auction", "configure auction", "set up auction"], module: "auction", flow: "auction_config" },
  { keywords: ["start auction", "go live", "live auction", "begin auction"], module: "auction", flow: "start_auction" },
  { keywords: ["bid", "bidding", "how to bid", "place bid"], module: "auction", flow: "bidding_flow" },
  { keywords: ["sold", "pass", "unsold", "queue"], module: "auction", flow: "sold_pass_queue" },
  { keywords: ["rtm", "right to match"], module: "auction", flow: "rtm_guide" },
  { keywords: ["auction result", "auction outcome", "who got sold"], module: "auction", flow: "auction_results" },
  { keywords: ["team setup", "create team", "team budget"], module: "auction", flow: "team_setup" },
  { keywords: ["player pool", "manage player", "player list"], module: "auction", flow: "player_pool" },
  { keywords: ["schedule match", "generate schedule", "create schedule"], module: "scheduler", flow: "match_schedule" },
  { keywords: ["group", "group assign", "group stage", "pool"], module: "scheduler", flow: "group_assign" },
  { keywords: ["playoff", "bracket", "knockout", "semi final", "final"], module: "scheduler", flow: "playoff_bracket" },
  { keywords: ["match result", "update score", "match status"], module: "scheduler", flow: "match_status" },
  { keywords: ["my team", "find team", "which team", "team roster"], module: "sports_dashboard", flow: "find_my_team" },
  { keywords: ["my registration", "check registration", "registration history"], module: "sports_dashboard", flow: "my_registrations" },
  { keywords: ["what's happening", "live now", "today match", "today's match"], module: "sports_dashboard", flow: "whats_happening" },
  { keywords: ["event badge", "status badge", "green badge", "red badge"], module: "sports_dashboard", flow: "event_status_badges" },
  { keywords: ["quick register", "fast register"], module: "sports_dashboard", flow: "quick_register" },
  { keywords: ["role", "permission", "access", "what role"], module: "roles", flow: "role_overview" },
  { keywords: ["create role", "custom role", "new role"], module: "roles", flow: "create_role" },
  { keywords: ["assign role", "change role", "user role"], module: "roles", flow: "assign_role" },
  { keywords: ["permission matrix", "permission table"], module: "roles", flow: "permission_matrix" },
  { keywords: ["create user", "add user", "new member"], module: "admin", flow: "create_user" },
  { keywords: ["bulk upload", "upload users", "csv users"], module: "admin", flow: "bulk_upload" },
  { keywords: ["audit log", "audit trail", "activity log", "who changed"], module: "admin", flow: "audit_logs" },
  { keywords: ["create community", "new community", "add community"], module: "admin", flow: "community_create" },
  { keywords: ["admin dashboard", "admin overview", "admin panel"], module: "admin", flow: "admin_overview" },
  { keywords: ["expense", "create expense", "add expense", "submit expense"], module: "finance", flow: "create_expense" },
  { keywords: ["invoice", "my invoice", "bill", "my bill", "payment"], module: "finance", flow: "invoice_management" },
  { keywords: ["gst", "tax", "cgst", "sgst"], module: "finance", flow: "gst_breakdown" },
  { keywords: ["budget", "budget plan", "spending limit"], module: "finance", flow: "budget_planning" },
  { keywords: ["financial report", "finance report", "expense report"], module: "finance", flow: "financial_reports" },
  { keywords: ["approve expense", "reject expense"], module: "finance", flow: "approve_expense" },
  { keywords: ["inventory", "stock", "supplies"], module: "inventory", flow: "inventory_dashboard" },
  { keywords: ["add item", "add inventory", "new item"], module: "inventory", flow: "add_inventory" },
  { keywords: ["stock level", "stock tracking", "low stock", "restock"], module: "inventory", flow: "stock_tracking" },
  { keywords: ["listing", "sell item", "sell something", "create listing", "marketplace"], module: "marketplace", flow: "create_listing" },
  { keywords: ["contact seller", "buy item", "purchase"], module: "marketplace", flow: "contact_seller" },
  { keywords: ["post job", "job opening", "hiring", "create job"], module: "jobs", flow: "post_job" },
  { keywords: ["apply job", "apply for job", "job application"], module: "jobs", flow: "apply_job" },
  { keywords: ["referral", "refer someone"], module: "jobs", flow: "referral_program" },
  { keywords: ["maintenance", "maintenance ticket", "repair", "fix issue", "broken"], module: "community_ops", flow: "raise_maintenance" },
  { keywords: ["procurement", "purchase request", "buy supplies"], module: "community_ops", flow: "raise_procurement" },
  { keywords: ["asset audit", "verify assets", "asset check"], module: "community_ops", flow: "asset_audit" },
  { keywords: ["checkout asset", "borrow equipment", "asset checkout"], module: "assets", flow: "asset_checkout" },
  { keywords: ["receipt", "upload receipt", "expense receipt"], module: "assets", flow: "expense_upload" },
  { keywords: ["analytics", "sports analytics", "participation trend", "stats"], module: "sports_analytics", flow: "analytics_dashboard" },
  { keywords: ["export", "download report", "export data"], module: "sports_analytics", flow: "export_analytics" },
];

function findMatchingFlow(query: string): { module: string; flow: string } | null {
  const q = query.toLowerCase().replace(/[?!.,]/g, "");
  let bestMatch: { module: string; flow: string; score: number } | null = null;
  for (const entry of KEYWORD_FLOW_MAP) {
    for (const keyword of entry.keywords) {
      if (q.includes(keyword)) {
        const score = keyword.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { module: entry.module, flow: entry.flow, score };
        }
      }
    }
  }
  return bestMatch ? { module: bestMatch.module, flow: bestMatch.flow } : null;
}

function findMatchingModule(query: string): string | null {
  const q = query.toLowerCase();
  const moduleKeywords: Record<string, string[]> = {
    auth: ["login", "sign in", "sign up", "password", "otp", "kyc", "account"],
    feed: ["feed", "post", "community feed", "news"],
    chat: ["chat", "message", "dm", "conversation"],
    notifications: ["notification", "alert", "bell"],
    profile: ["profile", "avatar", "photo", "settings"],
    sports_dashboard: ["sport", "dashboard", "match", "game", "tournament", "team"],
    events: ["event", "tournament", "organize"],
    registration: ["register", "registration", "sign up for", "participate"],
    auction: ["auction", "bid", "player auction", "sold", "rtm"],
    scheduler: ["schedule", "fixture", "bracket", "playoff", "group stage"],
    admin: ["admin", "user management", "audit", "system"],
    venues: ["venue", "court", "ground", "stadium"],
    roles: ["role", "permission", "access control"],
    finance: ["finance", "expense", "invoice", "bill", "gst", "payment", "budget"],
    inventory: ["inventory", "stock", "supplies", "equipment"],
    marketplace: ["marketplace", "buy", "sell", "listing"],
    jobs: ["job", "referral", "hiring", "career", "vacancy"],
    community_ops: ["maintenance", "procurement", "community ops", "repair"],
    assets: ["asset", "checkout", "receipt"],
    sports_analytics: ["analytics", "report", "trend", "insight"],
  };
  for (const [mod, keywords] of Object.entries(moduleKeywords)) {
    if (keywords.some(k => q.includes(k))) return mod;
  }
  return null;
}

// ─── Quick Replies (context-aware) ────────────────────────────────────────────

const QUICK_REPLIES_DEFAULT = [
  "About Mana Community",
  "How do I get started?",
  "I need help with sports",
  "Show all modules",
];

const QUICK_REPLIES_MODULE = [
  "Show me the full flow",
  "What permissions do I need?",
  "Common issues",
  "Show next step",
];

const MODULE_QUICK_REPLIES: Record<string, string[]> = {
  sports_dashboard: [
    "How do I register for an event?",
    "Where can I see my team?",
    "What's happening today?",
    "How do I check match schedule?",
  ],
  events: [
    "How do I create an event?",
    "How does event status work?",
    "How to share event link?",
    "How to add sponsors?",
  ],
  registration: [
    "How do I register for an event?",
    "What does PENDING mean?",
    "How to become captain?",
    "Can I withdraw my registration?",
  ],
  auction: [
    "How to set up an auction?",
    "How does bidding work?",
    "What is RTM?",
    "How to upload players via CSV?",
  ],
  scheduler: [
    "How to generate a schedule?",
    "How do playoffs work?",
    "How to set venue timings?",
    "How to update match results?",
  ],
  auth: [
    "I forgot my password",
    "OTP is not arriving",
    "How does KYC work?",
    "My session keeps expiring",
  ],
  feed: [
    "How do I create a post?",
    "Who can see my posts?",
    "Can I delete someone's post?",
    "What are the community rules?",
  ],
  chat: [
    "How to start a chat?",
    "How do group chats work?",
    "What is admin chat?",
    "How to mute notifications?",
  ],
  admin: [
    "How to create a user?",
    "How to bulk upload users?",
    "How to check audit logs?",
    "How to manage communities?",
  ],
  finance: [
    "How to create an expense?",
    "How does GST work here?",
    "How to view my invoices?",
    "How to generate reports?",
  ],
  inventory: [
    "How to add an item?",
    "How to track stock levels?",
    "How to search inventory?",
    "What is inventory management?",
  ],
  community_ops: [
    "How to raise maintenance ticket?",
    "How does procurement work?",
    "How to run an asset audit?",
    "How to change community settings?",
  ],
  marketplace: [
    "How to create a listing?",
    "How to contact a seller?",
    "How to search items?",
    "Can I edit my listing?",
  ],
  jobs: [
    "How to post a job?",
    "How to apply for a job?",
    "How do referrals work?",
    "How to view applications?",
  ],
  roles: [
    "What roles are available?",
    "How to create a custom role?",
    "How to assign a role?",
    "How does the permission matrix work?",
  ],
  venues: [
    "How to add a venue?",
    "How to manage courts?",
    "How to add a map link?",
    "How to set venue timings?",
  ],
  profile: [
    "How to edit my profile?",
    "How to change profile picture?",
    "How to submit KYC docs?",
    "How to change my password?",
  ],
  notifications: [
    "What notification types are there?",
    "How to mark all as read?",
    "How to change notification settings?",
    "Common issues",
  ],
  assets: [
    "How to checkout an asset?",
    "How to upload a receipt?",
    "How does treasurer approval work?",
    "Common issues",
  ],
  sports_analytics: [
    "How to view analytics?",
    "How to see participation trends?",
    "How to export reports?",
    "What data is available?",
  ],
};

// ─── UI Components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "8px 0", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%", background: "#94a3b8",
            animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }`}</style>
    </div>
  );
}

interface StepCardProps {
  step: { step: number; name: string; desc: string; tip: string };
  isActive: boolean;
}

function StepCard({ step, isActive }: StepCardProps) {
  return (
    <div
      style={{
        background: isActive ? "rgba(99,102,241,0.08)" : "rgba(248,250,252,0.6)",
        border: isActive ? "1.5px solid rgba(99,102,241,0.3)" : "1px solid #e2e8f0",
        borderRadius: 12, padding: "12px 14px", marginBottom: 8, transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 24, height: 24, borderRadius: "50%",
            background: isActive ? "#6366f1" : "#cbd5e1",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}
        >
          {step.step}
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{step.name}</span>
      </div>
      <p style={{ fontSize: 13, color: "#475569", margin: "0 0 8px 32px", lineHeight: 1.5 }}>{step.desc}</p>
      <div
        style={{
          marginLeft: 32, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#92400e", lineHeight: 1.4,
        }}
      >
        💡 <strong>Tip:</strong> {step.tip}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AppFlowChatbot({ isFloating }: { isFloating?: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [apiLoading, setApiLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("core");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    setMessages([{
      id: Date.now(), role: "bot", type: "text",
      content: "Welcome to **Mana Community**! 👋\n\n**Mana** is your all-in-one community management platform — organize sports tournaments with live auctions and match scheduling, manage community finances with GST-compliant billing, handle maintenance requests, track inventory, and connect with your neighbors through feeds, chat, marketplace, and job boards.\n\nAsk me anything about the app or pick a module below to explore step-by-step guides!",
    }]);
  }, []);

  useEffect(scrollToBottom, [messages, typing, scrollToBottom]);

  const addBotMessage = useCallback((content: any, type = "text", extra = {}) => {
    return new Promise<void>((resolve) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role: "bot", content, type, ...extra }]);
        resolve();
      }, 500 + Math.random() * 300);
    });
  }, []);

  const MODULE_WELCOME: Record<string, string> = {
    sports_dashboard: `Here are the guides for **Sports Dashboard**. Whether you want to register for an event, check your team, or see live matches — pick a topic below:\n\n💡 **Quick tip:** Try the suggested questions below for the most common tasks!`,
    events: `Here are the guides for **Sports Events**. From creating events to managing their lifecycle — everything is covered:\n\n💡 **Quick tip:** Start with 'Event Status Lifecycle' if you're new to organizing events.`,
    registration: `Here are the guides for **Player Registration**. Learn how to sign up, get approved, and manage your registrations:\n\n💡 **Quick tip:** If you received a link from someone, check 'Register via Shared Link'.`,
    auction: `Here are the guides for **Player Auction**. Set up configs, manage player pools, and run live bidding sessions:\n\n💡 **Quick tip:** Follow the guides in order: Config → Player Pool → Teams → Start Auction.`,
    finance: `Here are the guides for **Finance & Billing**. Manage expenses, invoices with GST breakdown, budgets, and reports:\n\n💡 **Quick tip:** If you're a resident, check 'Invoice Management' → 'My Invoices' to see your bills.`,
    admin: `Here are the guides for **Admin Dashboard**. Manage users, roles, communities, and system settings:\n\n💡 **Quick tip:** New admin? Start with 'Admin Dashboard Guide' for an overview of all sections.`,
    community_ops: `Here are the guides for **Community Operations**. Handle procurement, maintenance requests, and asset audits:\n\n💡 **Quick tip:** Any resident can raise a maintenance ticket — no special permissions needed!`,
    inventory: `Here are the guides for **Inventory**. Track community supplies, equipment, and stock levels:\n\n💡 **Quick tip:** Check 'Stock Level Tracking' to see items that need restocking.`,
  };

  const handleModuleSelect = useCallback(async (moduleKey: string) => {
    const mod = MODULES[moduleKey];
    if (!mod) return;
    setSelectedModule(moduleKey);
    setSelectedFlow(null);
    setCurrentStep(0);
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: `${mod.icon} ${mod.label}`, type: "text" }]);
    const welcomeMsg = MODULE_WELCOME[moduleKey]
      || `Here are the guides for **${mod.label}**. Tap any topic to get a step-by-step walkthrough:\n\n💡 **Quick tip:** Use the suggested questions below or pick a guide above!`;
    await addBotMessage(welcomeMsg, "text");
  }, [addBotMessage]);

  const handleFlowSelect = useCallback(async (flowId: string) => {
    const flow = FLOW_DATA[flowId];
    if (!flow) return;
    setSelectedFlow(flowId);
    setCurrentStep(0);
    const mod = selectedModule ? MODULES[selectedModule] : null;
    const flowMeta = mod?.flows.find((f) => f.id === flowId);
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: `${flowMeta?.icon || "📋"} ${flow.title}`, type: "text" }]);
    await addBotMessage(`**${flow.title}** — ${flow.steps.length} steps:`, "text");
    await addBotMessage(flow.steps, "steps");
  }, [selectedModule, addBotMessage]);

  const handleQuickReply = useCallback(async (reply: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: reply, type: "text" }]);

    if (reply === "Show next step" && selectedFlow) {
      const flow = FLOW_DATA[selectedFlow];
      if (currentStep < flow.steps.length - 1) {
        const next = currentStep + 1;
        setCurrentStep(next);
        await addBotMessage([flow.steps[next]], "steps");
        await addBotMessage(
          next < flow.steps.length - 1
            ? `Step ${next + 1} of ${flow.steps.length}. Want to see the next one?`
            : `That's the final step! You've completed **${flow.title}**. Pick another topic to explore.`
        );
      } else {
        await addBotMessage("You've seen all steps in this guide! Pick another topic or module to continue.");
      }
      return;
    }

    if (reply === "Show me the full flow" && selectedFlow) {
      const flow = FLOW_DATA[selectedFlow];
      await addBotMessage(flow.steps, "steps");
      return;
    }

    if (reply === "Show all modules") {
      await addBotMessage("Here are all the modules I can help with:\n\n" +
        Object.entries(MODULES).map(([, m]) => `${m.icon} **${m.label}** — ${m.flows.length} guides`).join("\n"));
      return;
    }

    if (reply === "About Mana Community") {
      await addBotMessage(
        "**Mana Community** is a comprehensive platform for residential communities, sports clubs, and neighborhood associations.\n\n**What it does:**\n\n🏆 **Sports Management** — Create tournaments, run live player auctions with real-time bidding, auto-generate match schedules (round robin, knockout, playoffs), and track scores with live leaderboards.\n\n💰 **Finance & Billing** — Manage community expenses with approval workflows, generate per-resident invoices with GST breakdown (CGST + SGST), plan budgets, and run financial reports.\n\n🏘️ **Community Operations** — Raise maintenance tickets, submit procurement requests, track inventory and assets, and run asset audits.\n\n📰 **Social & Communication** — Community feed for posts and announcements, real-time chat (direct and group), and in-app notifications.\n\n🛒 **Marketplace & Jobs** — Buy/sell items within your community, post job openings, and run referral programs.\n\n🛡️ **Admin Tools** — User management with role-based permissions, bulk CSV uploads, KYC verification, audit logs, and session monitoring.\n\nAsk me about any feature for a detailed step-by-step guide!"
      );
      return;
    }

    if (reply === "How do I get started?") {
      await addBotMessage(
        "Getting started with Mana Community is easy! Here's your setup checklist:\n\n**1. Create Your Account**\nSign up with your email and phone number. You'll need a community invite code if your community requires one.\n\n**2. Verify Your Identity**\nComplete KYC by submitting a government ID (Aadhaar, Voter ID, or Driving Licence). Your admin will approve it.\n\n**3. Explore Your Community**\nOnce verified, you can:\n• 📰 Browse the **Community Feed** for updates\n• 🏆 Check **Sports** for upcoming events and register\n• 💬 Start **Chatting** with neighbors\n• 💰 View your **Invoices** under Finance\n• 🛒 Browse the **Marketplace**\n• 💼 Check **Jobs & Referrals**\n• 🔧 Raise **Maintenance Tickets** if something needs fixing\n\n**4. Customize Notifications**\nGo to Profile → Settings to choose what alerts you receive.\n\nTap any module above for detailed step-by-step walkthroughs!"
      );
      return;
    }

    if (reply === "What can I do here?") {
      await addBotMessage(
        "This chatbot is your guide to **every feature** in the Mana Community app. Here's how I can help:\n\n**Browse by Module** — Use the category tabs (Core, Sports, Admin, Finance, Community) to find the feature you need.\n\n**Step-by-Step Guides** — Each feature has a detailed walkthrough with numbered steps and tips.\n\n**Ask Me Anything** — Type your question in natural language. For example:\n• \"How do I register for a cricket tournament?\"\n• \"How does the auction bidding work?\"\n• \"What's the difference between PENDING and CONFIRMED?\"\n• \"How do I create an expense with GST?\"\n• \"How to raise a maintenance ticket?\"\n\n**Quick Actions** — Use the suggestion buttons below the chat for common questions.\n\nI cover **20+ modules** with **120+ detailed guides** — just ask!"
      );
      return;
    }

    if (reply === "I need help with sports") {
      setActiveCategory("sports");
      await addBotMessage(
        "Sports is the most feature-rich module! Here's everything you can do:\n\n🏆 **Sports Dashboard** — Overview of all events, your registrations, live matches, and season stats.\n\n📅 **Events** — Create tournaments, set venues, configure player categories, add sponsors, and manage the full event lifecycle (Draft → Open → Live → Completed).\n\n✍️ **Registration** — Register for events, get admin approval, nominate yourself as captain, and import players via CSV.\n\n🔨 **Auction** — Set up team budgets, configure bid rules, manage player pools, and run live auctions with real-time bidding and RTM (Right to Match).\n\n📋 **Scheduler** — Assign groups, auto-generate match schedules, set venue timings, and generate playoff brackets.\n\n📊 **Analytics** — View participation trends, event reports, and export data.\n\nSelect a sports module above to get detailed step-by-step guides, or ask me a specific question!"
      );
      return;
    }

    if (reply === "What permissions do I need?" && selectedModule) {
      const mod = MODULES[selectedModule];
      const permMap: Record<string, string> = {
        auth: "No special permissions — login is available to all users.",
        feed: "**View Feed** to see posts, **Create Post** to publish, **Delete Post** to remove (own or admin).",
        chat: "All authenticated users can chat. Admin chat requires admin roles.",
        notifications: "All authenticated users receive notifications.",
        profile: "All users can edit their own profile.",
        sports_dashboard: "**View Sports Menu** to access, **View Sports Main** for details.",
        events: "**View Sports Main** to see events. **Create/Edit Sports Main** to create/edit events.",
        registration: "**View Event Registrations** to register. **Create/Edit Event Registrations** to approve (admin).",
        auction: "**View Auction Config** to see. **Create/Edit Auction Config** to set up. **Create/Edit Live Auction** to run.",
        scheduler: "**View Sports Menu** to view schedules. Schedule creation uses the admin sports permissions.",
        admin: "**View Admin** for dashboard. **Manage Roles**, **Bulk Upload**, **Manage Communities** for specific features.",
        venues: "**View Admin** or **Edit Venue Timing** for venues. Admin/Sports Admin can create venues.",
        roles: "**Manage Roles** permission required. Only ADMIN and SUPER_ADMIN by default.",
        marketplace: "**View Marketplace** to browse. **Create Listing** to post items.",
        jobs: "**View Jobs** to browse. **Create Job** to post openings.",
        finance: "**View Admin** to access Finance. All billing endpoints (expenses, invoices, GST) require admin authority. Residents can view their own invoices via 'My Invoices'.",
        inventory: "**View Admin** or inventory management role to access. All community members can view the inventory dashboard, but adding/editing requires admin permissions.",
        assets: "All authenticated users can browse and checkout available assets. Expense receipt upload requires the relevant expense permission. Treasurer queue requires admin/treasurer role.",
        community_ops: "Any member can **raise maintenance tickets**. Procurement requests require admin permission. **Asset audit** is admin/super admin only.",
        sports_analytics: "**View Sports Menu** to access analytics. Data is read-only — no special write permissions needed.",
      };
      await addBotMessage(permMap[selectedModule] || `Permissions for ${mod.label} depend on your role. Contact your admin for access.`);
      return;
    }

    if (reply === "Common issues" && selectedModule) {
      const issueMap: Record<string, string> = {
        auth: "**Common issues:**\n• OTP not arriving → Check spam, wait 30s, try resend\n• Account locked → Contact your admin\n• Session expired → Re-login, save work frequently",
        feed: "**Common issues:**\n• Can't see feed → Check 'View Feed' permission\n• Can't post → Need 'Create Post' permission\n• Empty feed → No posts in your community yet",
        chat: "**Common issues:**\n• Messages not delivered → Check internet connection (WebSocket needs stable connection)\n• Can't find user → They must be in your community\n• No typing indicator → Other user may have the chat minimized",
        notifications: "**Common issues:**\n• Not receiving notifications → Check notification preferences in Profile → Settings\n• Too many notifications → Mute specific group chats or event channels\n• Old notifications won't clear → Click 'Dismiss All' in the notification panel",
        profile: "**Common issues:**\n• Can't edit fields → Some fields are locked by your admin (e.g., community, role)\n• Profile picture won't upload → Check file is JPG/PNG and under 5MB\n• KYC stuck on PENDING → Your admin needs to review and approve it",
        sports_dashboard: "**Common issues:**\n• Dashboard empty → No events created in your community yet\n• Stats show zero → Check you have 'View Sports Menu' permission\n• Can't see events → Events may be in DRAFT status (admin only)",
        events: "**Common issues:**\n• Can't create event → Need 'Create/Edit Sports Main' permission\n• Event not visible → Check status is not DRAFT\n• Can't set venue → Create venue first in Admin → Venues",
        registration: "**Common issues:**\n• Registration button disabled → Registration may be closed or you're already registered\n• Status stuck on PENDING → Admin needs to approve\n• Wrong category → Withdraw and re-register",
        auction: "**Common issues:**\n• Can't start auction → Change status to ACTIVE first, then LIVE\n• Budget exceeded → Can't bid more than remaining team budget\n• Players missing → Check they're added to the player pool",
        scheduler: "**Common issues:**\n• Can't generate schedule → Groups must be assigned first\n• Time conflict → Two matches on same court at same time\n• Missing matches → Check all groups have players",
        admin: "**Common issues:**\n• Can't see admin → Need 'View Admin' permission\n• Bulk upload fails → Check CSV format matches template\n• Can't change role → Only ADMIN/SUPER_ADMIN can change roles",
        venues: "**Common issues:**\n• Can't add venue → Need admin or sports admin permissions\n• Map link not working → Use Google Maps 'Share' link, not the browser URL\n• Court conflict in scheduling → Two matches assigned to same court at same time",
        roles: "**Common issues:**\n• Can't create roles → Need 'Manage Roles' permission (ADMIN/SUPER_ADMIN only)\n• User permissions not updating → User needs to log out and back in\n• Missing permission options → Some permissions are only available at Super Admin level",
        marketplace: "**Common issues:**\n• Can't post listing → Need 'Create Listing' permission (most roles have it)\n• Listing not visible → It may have been removed by an admin for guideline violations\n• Can't contact seller → They must be an active member in your community",
        jobs: "**Common issues:**\n• Can't post job → Need 'Create Job' permission\n• Job not visible → Check if it was closed by the poster\n• Can't apply → The posting may have reached its application limit",
        finance: "**Common issues:**\n• Can't see Finance → Need 'View Admin' permission\n• GST amounts look wrong → GST is 18% total (9% CGST + 9% SGST), applied on the base amount\n• Invoices not generated → Expense must be APPROVED first; generation runs asynchronously",
        inventory: "**Common issues:**\n• Inventory page empty → No items added yet; click '+ Add Item' to start\n• Stock count incorrect → Use 'Adjust Stock' with a reason note for corrections\n• Can't edit item → Check you have admin or inventory management permissions",
        assets: "**Common issues:**\n• Can't checkout asset → It may already be checked out by someone else\n• Receipt upload fails → File must be under 5MB, formats: PDF, JPG, PNG\n• Treasurer queue empty → No pending expense approvals at the moment",
        community_ops: "**Common issues:**\n• Maintenance ticket not assigned → Admin needs to assign a maintenance staff member\n• Procurement stuck on 'Submitted' → Waiting for admin/treasurer approval\n• Audit report incomplete → Complete all verification checkmarks before generating the report",
        sports_analytics: "**Common issues:**\n• Analytics show no data → Need completed events with results for meaningful analytics\n• Export fails → Try a smaller date range or switch from PDF to CSV format\n• Charts not loading → Refresh the page; large datasets may take a moment to render",
      };
      await addBotMessage(issueMap[selectedModule] || "For common issues with this module, try: check your permissions, refresh the page, or contact your admin.");
      return;
    }

    // Smart keyword matching for freeform questions
    const flowMatch = findMatchingFlow(reply);
    if (flowMatch) {
      const flow = FLOW_DATA[flowMatch.flow];
      const mod = MODULES[flowMatch.module];
      if (flow && mod) {
        setSelectedModule(flowMatch.module);
        setSelectedFlow(flowMatch.flow);
        setCurrentStep(0);
        const cat = MODULE_CATEGORIES.find(c => c.modules.includes(flowMatch.module));
        if (cat) setActiveCategory(cat.id);
        await addBotMessage(`Great question! Here's the guide for **${flow.title}** (under ${mod.icon} ${mod.label}):\n\n${flow.steps.length} steps to follow:`);
        await addBotMessage(flow.steps, "steps");
        return;
      }
    }

    const moduleMatch = findMatchingModule(reply);
    if (moduleMatch) {
      const mod = MODULES[moduleMatch];
      if (mod) {
        setSelectedModule(moduleMatch);
        setSelectedFlow(null);
        setCurrentStep(0);
        const cat = MODULE_CATEGORIES.find(c => c.modules.includes(moduleMatch));
        if (cat) setActiveCategory(cat.id);
        const welcomeMsg = MODULE_WELCOME[moduleMatch]
          || `Here are the guides for **${mod.label}**. Tap any topic to get a step-by-step walkthrough:`;
        await addBotMessage(`I can help with **${mod.label}**! ${welcomeMsg}\n\nSelect a topic above or ask a more specific question.`);
        return;
      }
    }

    // Fallback — no keyword match found
    await addBotMessage(
      `I didn't find an exact match for that, but I can still help! Here are some things you can try:\n\n**Ask about a specific feature:**\n• "How do I register for an event?"\n• "How does the auction work?"\n• "How to create an expense?"\n• "How to raise a maintenance ticket?"\n\n**Browse by category:**\nUse the tabs above (Core, Sports, Admin, Finance, Community) to explore all available modules.\n\n**Quick actions:**\nTap any suggestion button below the chat.\n\nI have **120+ step-by-step guides** covering every feature — try rephrasing your question with a specific feature name!`
    );
  }, [selectedModule, selectedFlow, currentStep, addBotMessage]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await handleQuickReply(text);
  }, [input, handleQuickReply]);

  const renderMessage = (msg: any) => {
    const isUser = msg.role === "user";
    if (msg.type === "steps") {
      return (
        <div key={msg.id} style={{ margin: "8px 0", maxWidth: "88%" }}>
          {msg.content.map((step: any, i: number) => (
            <StepCard key={i} step={step} isActive={i === 0} />
          ))}
        </div>
      );
    }
    return (
      <div key={msg.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", margin: "6px 0" }}>
        <div
          style={{
            maxWidth: "82%", padding: "10px 14px",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: isUser ? "#6366f1" : "#f1f5f9",
            color: isUser ? "#fff" : "#1e293b",
            fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left",
          }}
        >
          {msg.content.split("**").map((part: string, i: number) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
          )}
        </div>
      </div>
    );
  };

  const quickReplies = selectedFlow
    ? QUICK_REPLIES_MODULE
    : selectedModule && MODULE_QUICK_REPLIES[selectedModule]
      ? MODULE_QUICK_REPLIES[selectedModule]
      : QUICK_REPLIES_DEFAULT;
  const visibleModules = MODULE_CATEGORIES.find(c => c.id === activeCategory)?.modules || [];

  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        height: isFloating ? "100%" : "100vh",
        background: "#ffffff",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: isFloating ? "100%" : 560,
        margin: "0 auto",
        borderLeft: isFloating ? "none" : "1px solid #e2e8f0",
        borderRight: isFloating ? "none" : "1px solid #e2e8f0",
      }}
    >
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", padding: "16px 18px", color: "#fff", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            🏠
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Mana Community</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>Your community management assistant</div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#fafbfc", flexShrink: 0, overflowX: "auto" }}>
        {MODULE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setSelectedModule(null); setSelectedFlow(null); }}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: activeCategory === cat.id ? "2px solid #6366f1" : "1.5px solid #d1d5db",
              background: activeCategory === cat.id ? "rgba(99,102,241,0.06)" : "#fff",
              color: activeCategory === cat.id ? "#6366f1" : "#64748b",
              fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Module Selector */}
      <div style={{ display: "flex", gap: 6, padding: "10px 14px", borderBottom: "1px solid #e2e8f0", background: "#fff", flexShrink: 0, overflowX: "auto" }}>
        {visibleModules.map((key) => {
          const mod = MODULES[key];
          if (!mod) return null;
          return (
            <button
              key={key}
              onClick={() => handleModuleSelect(key)}
              style={{
                padding: "6px 12px", borderRadius: 16,
                border: selectedModule === key ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                background: selectedModule === key ? "#eef2ff" : "#f8fafc",
                color: selectedModule === key ? "#4338ca" : "#64748b",
                fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {mod.icon} {mod.label}
            </button>
          );
        })}
      </div>

      {/* Flow Selector (when module is selected) */}
      {selectedModule && MODULES[selectedModule] && (
        <div style={{ display: "flex", gap: 6, padding: "8px 14px", borderBottom: "1px solid #e2e8f0", background: "#fafbfc", flexShrink: 0, overflowX: "auto", flexWrap: "wrap" }}>
          {MODULES[selectedModule].flows.map((flow) => (
            <button
              key={flow.id}
              onClick={() => handleFlowSelect(flow.id)}
              style={{
                padding: "5px 10px", borderRadius: 14,
                border: selectedFlow === flow.id ? "1.5px solid #6366f1" : "1px solid #e2e8f0",
                background: selectedFlow === flow.id ? "#eef2ff" : "#fff",
                color: selectedFlow === flow.id ? "#4338ca" : "#64748b",
                fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 3,
              }}
            >
              {flow.icon} {flow.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column" }}>
        {messages.map(renderMessage)}
        {(typing || apiLoading) && (
          <div style={{ display: "flex", margin: "6px 0" }}>
            <div style={{ padding: "10px 14px", background: "#f1f5f9", borderRadius: "16px 16px 16px 4px" }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Replies */}
      <div style={{ display: "flex", gap: 6, padding: "8px 14px", overflowX: "auto", flexShrink: 0, borderTop: "1px solid #f1f5f9" }}>
        {quickReplies.map((reply) => (
          <button
            key={reply}
            onClick={() => handleQuickReply(reply)}
            disabled={typing || apiLoading}
            style={{
              padding: "6px 12px", borderRadius: 14, border: "1px solid #d1d5db",
              background: "#fff", color: "#4b5563", fontSize: 12,
              cursor: typing || apiLoading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap", opacity: typing || apiLoading ? 0.5 : 1, transition: "all 0.15s",
            }}
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #e2e8f0", background: "#fff", flexShrink: 0, display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask anything — e.g. 'How do I register for a tournament?'"
          disabled={typing || apiLoading}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 20,
            border: "1.5px solid #d1d5db", fontSize: 14, outline: "none",
            background: "#f8fafc", color: "#1e293b", transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || typing || apiLoading}
          style={{
            width: 40, height: 40, borderRadius: "50%", border: "none",
            background: input.trim() && !typing ? "#6366f1" : "#e2e8f0",
            color: "#fff", fontSize: 18,
            cursor: input.trim() && !typing ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s", flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
