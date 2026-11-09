import { Compass } from "lucide-react";
import Link from "next/link";

import {
  buttonClasses,
  Card,
  PageBand,
  PageContent,
} from "@/components/ui";
import { WORDING } from "@/lib/wording";

export default function NotFound() {
  return (
    <main>
      <PageBand icon={Compass} title={WORDING.notFound.heading} width="medium" />
      <PageContent width="medium">
        <Card>
          <Link href="/" className={buttonClasses}>
            {WORDING.notFound.backHome}
          </Link>
        </Card>
      </PageContent>
    </main>
  );
}
