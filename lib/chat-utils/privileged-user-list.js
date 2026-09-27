// Roles, never features: features (flairs) are cosmetic. Uppercase keys are
// dgg roles; lowercase ones are Twitch badges (see twitch-chat.js).
const PRIVILEGED_USER_ROLES = {
  ADMIN: true,
  MODERATOR: true,
  mod: true,
  admin: true,
  moderator: true,
};

const PROTECTED_USER_LIST = {
  PROTECTED: true,
  vip: true,
};

// dgg role whose holders can post links while !mutelinks is on.
const TRUSTED_USER_ROLE = 'TRUSTED';

module.exports = { PRIVILEGED_USER_ROLES, PROTECTED_USER_LIST, TRUSTED_USER_ROLE };
