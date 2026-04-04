class ApiEndpoints {
  static const currentProfile = "profile/current";
  static const createProfile = "profile";
  static String profileDetail(String userId) => "profile/$userId";
  static String followers(String userId) => "profile/$userId/followers";
  static String following(String userId) => "profile/$userId/following";
  static String removeFollower(String userId) => "profile/$userId/followers";
  static String unfollow(String userId) => "profile/$userId/following";
  static String follow(String userId) => "profile/$userId/followers";

  static const googleAuth = "auth/google";
  static const emailLogin = "auth/login";
  static const emailRegister = "auth/register";
  static const verifyOtp = "auth/verify-otp";
  static const resendOtp = "auth/resend-otp";
  static const forgotPassword = "auth/forgot-password";
  static const resetPassword = "auth/reset-password";
  static const refresh = "auth/refresh";
  static const logout = "auth/logout";

  static const cloudinarySign = "cloudinary/sign";
  static const home = "mobile/home";

  // Notifications
  static const notifications = "notifications";
  static const notificationsUnreadCount = "notifications/unread-count";
  static const notificationsMarkAllRead = "notifications/mark-all-read";
  static String notificationMarkRead(String id) => "notifications/$id";

  // Requests (Interests & Invitations)
  static const interests = "interests";
  static const interestsRespond = "interests/respond";
  static const pendingInvitations = "pending-invitations";
  static const groupInvitation = "group-invitation";
  static const myGroups = "mobile/groups";
  static const createGroup = "mobile/groups";

  // Settings
  static const changePassword = "settings/change-password";
  static const deleteAccount = "settings/delete-account";
  static const acceptPolicies = "settings/accept-policies";

  // Explore
  static const exploreSession = "explore/session";
  static const matchSolo = "explore/match-solo";
  static const matchGroups = "explore/match-groups";
  static const exploreInterest = "explore/interest";
  static const exploreSkip = "explore/skip";
  static const exploreReport = "explore/report";
}
