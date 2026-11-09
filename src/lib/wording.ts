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
    testPlans: "Test plans",
    siteLabel: "Site",
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
  eligibility: {
    eatingDisorderQuestion:
      "Have you been diagnosed with or treated for an eating disorder?",
    medicalConditionQuestion:
      "Do you have a medical condition, injury or doctor's restriction that affects exercise or eating?",
    yes: "Yes",
    no: "No",
    answerRequired: "Choose yes or no.",
    noPlan:
      "My Fit Plan can't create a plan for you. A health professional can help you find what suits you.",
    noWeightLossPlan:
      "My Fit Plan can't create a weight loss plan for you. A health professional can help you find what suits you.",
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
  testPlans: {
    heading: "Test plans",
    testModeNotice:
      "Test mode: this plan is created from a made-up sample profile. Your saved details are not sent.",
    demonstrationNotice:
      "Demonstration only: this isn't a plan to follow. It was built for a made-up person, not for you.",
    profileLabel: "Made-up profile",
    allergiesLabel: "Allergies",
    restrictionsLabel: "Dietary restrictions",
    none: "None",
    buildButton: "Build a one-month plan",
    loading: "Building the demonstration month. This can take a minute or two.",
    noPlanProduced:
      "No plan could be produced within the safety limits, so nothing is shown. A health professional can help you find what suits you.",
    geminiBusy:
      "Gemini is busy right now, so no plan was built. Please try again later.",
    geminiUnreachable:
      "Gemini couldn't be reached, so no plan was built. Please try again later.",
    currentHeading: "Current demonstration plan",
    startedLabel: "Started",
    weekLabel: "Week",
    startOver: "Start over",
    startOverQuestion: "Remove this plan and start over?",
    startOverConfirm: "Yes, remove it",
    startOverCancel: "Keep this plan",
  },
  daily: {
    dayLabel: "Day",
    ofLabel: "of",
    weekLabel: "Week",
    estimateLabel: "Gemini estimate",
    totalLabel: "Estimated total for the day",
    portionsLabel: "Portions",
    menuNotice:
      "This menu isn't for real use. AI menus can contain mistakes, and people with allergies should check ingredients.",
    choosePrompt: "Choose a made-up profile to see a demonstration plan.",
    answerPrompt:
      "Answer the two questions on your profile to see demonstration plans.",
    profileLink: "Go to your profile",
    restDay: "Rest day",
    loadMark: "Current load done with one to two extra repetitions",
    sameAsLastWeek: "Same as last week",
    increasedFromLastWeek: "Increased from last week",
    laterDays: "Amounts for later days can change.",
    pastDay: "This day can't be changed.",
    monthEnded: "This demonstration month has ended.",
    buildAnother: "Build another plan",
    previousDay: "Previous day",
    nextDay: "Next day",
    backToToday: "Back to today",
    planDaysLabel: "Plan days",
  },
  notFound: {
    heading: "This page doesn't exist",
    backHome: "Back to the home page",
  },
  history: {
    heading: "History",
    empty: "No past days to show yet.",
    exercisesHeading: "Exercises ticked",
    mealsHeading: "Meals marked as eaten",
    noteHeading: "Note",
  },
} as const;
