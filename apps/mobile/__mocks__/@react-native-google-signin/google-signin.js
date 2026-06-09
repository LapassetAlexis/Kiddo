const GoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn().mockResolvedValue({ data: { idToken: 'mock-id-token' } }),
  signOut: jest.fn().mockResolvedValue(undefined),
  isSignedIn: jest.fn().mockResolvedValue(false),
};

const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

module.exports = { GoogleSignin, statusCodes };
