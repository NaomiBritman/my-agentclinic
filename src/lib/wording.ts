/**
 * All new user-facing text, in one place, so the wording test and the project
 * owner's review cover the same list.
 */
export const WORDING = {
  accounts: {
    emailLabel: "Email",
    passwordLabel: "Password",
    passwordHelp: "Use at least eight characters.",
    signUpHeading: "Sign up",
    signUpButton: "Sign up",
    signUpNotice:
      "This local site has no password reset, so keep your password somewhere safe.",
    logInHeading: "Log in",
    logInButton: "Log in",
    logOutButton: "Log out",
    missingDetails: "Enter your email and password.",
    invalidEmail: "Enter a valid email address.",
    passwordTooShort: "Use a password with at least eight characters.",
    passwordTooLong: "Use a shorter password.",
    emailInUse: "This email already has an account.",
    signUpFailed: "The account couldn't be created. Please try again.",
    logInFailed: "That email and password don't match an account.",
  },
  navigation: {
    profile: "Profile",
  },
  profile: {
    heading: "Your profile",
    placeholder: "Your profile details will go here.",
    underAge:
      "My Fit Plan is for adults 18 or older, so this profile can't be saved.",
    goalNote:
      "Saving a goal doesn't create a plan. Personal plans aren't available yet.",
  },
  today: {
    exerciseLabel: "Sample list, not a personal plan.",
    menuLabel: "Sample menu, not a personal plan.",
    allExercisesTicked: "Everything on today's list is ticked.",
    someExercisesUnticked: "Some items on today's list aren't ticked.",
    noteLabel: "Anything else you ate (optional)",
    noteHelp: "This is only a note for you.",
  },
  history: {
    empty: "No past days to show yet.",
  },
} as const;
