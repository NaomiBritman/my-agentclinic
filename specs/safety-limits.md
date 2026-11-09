# Safety Limits

Values approved by the project owner on 2026-11-09. Code uses only these values, and no others may be invented. See [mission.md](mission.md) for the safety principles and [roadmap.md](roadmap.md) for the phases that implement them.

A source of "Owner decision" means the project owner set the value, and it doesn't come from a named health source.

## Exercise limits (Phases 9 and 12)

| Limit | Approved value | Source |
| --- | --- | --- |
| Aerobic exercise | 150 to 300 moderate minutes per week | WHO 2020 |
| Aerobic cap | Never more than 300 moderate minutes per week | Owner decision |
| Intensity | Plans use moderate intensity only | Owner decision |
| Strength, everyone | At least 2 days per week | ACSM 2009 |
| Strength, Beginner | 2 to 3 days per week | ACSM 2009 |
| Strength, Intermediate | 3 to 4 days per week | ACSM 2009 |
| Strength, Experienced | 4 to 5 days per week | ACSM 2009 |
| Load increase | At most 5% per week, and only after the current load is done with 1 to 2 extra repetitions | Owner decision (background: ACSM 2-10%) |
| Aerobic weekly increase | At most 10% per week, and never past the aerobic cap | Owner decision |
| No-load exercise weekly increase | At most 2 extra repetitions per set | Owner decision |

## Nutrition limits (Phase 13)

| Limit | Approved value | Source |
| --- | --- | --- |
| Weight loss goal | At most 0.9 kg per week | CDC |
| Menus | Never below 1,500 kcal per day | Owner decision |

Phase 15 has no daily targets beyond these approved limits.

## Goal eligibility (Phase 9)

The site doesn't offer a plan in these cases:

| Condition | Goals affected | Source |
| --- | --- | --- |
| Is under 18 | All goals | Mission (adults only) |
| Answers yes to the eating disorder question | All goals | Owner decision |
| Answers yes to the medical condition question | All goals | Owner decision |
| Has a BMI under 18.5 | Weight loss | WHO |

These questions are used as written:

- Have you been diagnosed with or treated for an eating disorder?
- Do you have a medical condition, injury or doctor's restriction that affects exercise or eating?

When no plan can be offered for any goal, the site shows this message as written:

> My Fit Plan can't create a plan for you. A health professional can help you find what suits you.

For a BMI under 18.5, the weight loss goal shows this message as written, and other goals stay available unless another rule applies:

> My Fit Plan can't create a weight loss plan for you. A health professional can help you find what suits you.

An under-18 profile still can't be saved, and it keeps its existing wording. The answers to both questions are never sent to the AI provider.

## AI data rules (Phase 10)

- **Test profiles only:** generation uses only built-in made-up test profiles, and never a saved profile, until the project owner chooses a paid tier or a local model.
- **Separate page:** generated plans appear on a separate test plans page, and `/today` daily tracking keeps using the sample lists.
- **Told first:** before generating, the site shows this notice as written: "Test mode: this plan is created from a made-up sample profile. Your saved details are not sent."
- **Details that may be sent:** the test profile's age, height, weight, fitness level, goal, allergies and dietary restrictions.

The Gemini API Additional Terms (effective March 23, 2026) are the reason for this rule. They say "Do not submit sensitive, confidential, or personal information to the Unpaid Services".

## Open items

These don't change what is approved above.

1. **Provider for real people:** a paid tier or a local model still needs to be chosen. Until then, no real person gets a personal AI plan or menu.
2. **Test plans page and eligibility (Phases 9 and 11):** it isn't decided whether a person told that no plan can be offered can still open the test plans page.
3. **Tracking generated plans (Phases 12 and 15):** `/today` doesn't track generated plans, so holding progression after missed days and comparing tracked meals with targets wait for the provider for real people.
