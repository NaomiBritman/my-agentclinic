# My Fit Plan

A website where a person signs up, enters their details, and gets a personal exercise plan and menu from an AI agent, then tracks them day by day.

Project name: `my-fit-plan`.

## Input from stakeholders

- A person signs up, logs in, and enters profile details such as age, height, weight and fitness level.
- An AI agent in the site builds a personal exercise plan and a menu according to the person's goal, such as weight loss, toning or muscle building.
- Each day, the person tracks their exercises and marks which planned meals they ate.
- The difficulty of the exercises goes up from week to week.
- AI output must stay within the safety limits approved by the project owner, listed in [specs/safety-limits.md](specs/safety-limits.md), and no other numbers may be invented.
- The AI provider is the Gemini API free tier, for made-up test profiles only. No real person's details may be sent until the owner chooses a paid tier or a local model, and the site must say so before generating.
- Progress must be gradual; the site must not encourage extreme dieting or overtraining, and it is not medical advice.
- The site stays local only for now, including `npm run start`, which must be limited to `127.0.0.1`.
