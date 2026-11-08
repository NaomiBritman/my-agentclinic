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
    today: "Today",
    history: "History",
    profile: "Profile",
  },
  profile: {
    heading: "Your profile",
    ageLabel: "Age",
    heightLabel: "Height (cm)",
    weightLabel: "Weight (kg)",
    fitnessLevelLabel: "Fitness level",
    goalLabel: "Goal",
    choose: "Choose one",
    fitnessLevels: {
      beginner: "Beginner",
      intermediate: "Intermediate",
      experienced: "Experienced",
    },
    goals: {
      "weight-loss": "Weight loss",
      toning: "Toning",
      "muscle-building": "Muscle building",
    },
    saveButton: "Save",
    saved: "Your profile is saved.",
    ageInvalid: "Enter your age as a whole number.",
    heightInvalid: "Enter your height in centimetres, as a number above zero.",
    weightInvalid: "Enter your weight in kilograms, as a number above zero.",
    fitnessLevelInvalid: "Choose a fitness level.",
    goalInvalid: "Choose a goal.",
    underAge:
      "My Fit Plan is for adults 18 or older, so this profile can't be saved.",
    goalNote:
      "Saving a goal doesn't create a plan. Personal plans aren't available yet.",
  },
  today: {
    heading: "Today",
    exercisesHeading: "Exercises",
    exerciseLabel: "Sample list, not a personal plan.",
    allExercisesTicked: "Everything on today's list is ticked.",
    someExercisesUnticked: "Some items on today's list aren't ticked.",
    menuHeading: "Menu",
    menuLabel: "Sample menu, not a personal plan.",
    noteLabel: "Anything else you ate (optional)",
    noteHelp: "This is only a note for you.",
    noteTooLong: "This note is too long, so it wasn't saved.",
    noteSaveButton: "Save note",
    noteSaved: "Your note is saved.",
  },
  history: {
    heading: "History",
    empty: "No past days to show yet.",
    exercisesHeading: "Exercises ticked",
    mealsHeading: "Meals marked as eaten",
    noteHeading: "Note",
  },
} as const;
