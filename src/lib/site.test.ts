import { expect, test } from "vitest";

import { MEDICAL_NOTICE } from "./site";

test("the notice says the site is not medical advice", () => {
  expect(MEDICAL_NOTICE).toContain("not medical advice");
});
