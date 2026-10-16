import { GuardDemo, JdDemo, RagInspector } from "@/components/lab/lab-demos";
import { PageHeader } from "@/components/site/page-header";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("lab");

export default function LabPage() {
  return (
    <>
      <PageHeader
        label="AI Lab"
        title="Look inside the machine."
        description="Small live demos of the pieces that power ABI. Each one calls the same production agent backend."
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-28 sm:px-8">
        <RagInspector />
        <GuardDemo />
        <JdDemo />
      </div>
    </>
  );
}
