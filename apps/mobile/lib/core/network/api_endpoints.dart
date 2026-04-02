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
}
