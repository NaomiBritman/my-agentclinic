# My Fit Plan

A website where a person signs up, enters their details, and gets a personal exercise plan and menu from an AI agent, then tracks them day by day.

Project name: `my-fit-plan`.

## Input from stakeholders

- A person signs up, logs in, and enters profile details such as age, height, weight and fitness level.
- An AI agent in the site builds a personal exercise plan and a menu according to the person's goal, such as weight loss, toning or muscle building.
- Each day, the person tracks their exercises and marks which planned meals they ate.
- The difficulty of the exercises goes up from week to week.
- AI output must stay within the safety limits approved by the project owner, listed in [specs/safety-limits.md](specs/safety-limits.md). Limits come from reliable health sources or a labeled owner decision, and no other numbers may be invented.
- The AI provider is the Gemini API free tier. Until the owner chooses a paid tier or a local model, generation uses only built-in made-up test profiles and never a saved profile, and the site shows test mode and demonstration notices before generating.
- A person chooses a made-up profile, Gemini builds a one-month demonstration plan, and `/today` shows that day's exercises and meals to tick, with estimated calories labeled as Gemini estimates and never as targets.
- The whole site has a modern, colorful, consistent design on phones and desktops, with readable text and no photos of people.
- Progress must be gradual; the site must not encourage extreme dieting or overtraining, and it is not medical advice.
- The site stays local only for now, including `npm run start`, which must be limited to `127.0.0.1`.
