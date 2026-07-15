import { WorkflowPage } from "@/components/WorkflowPage";

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowPage mode="evidence" reportId={id} eyebrow="Evidence recovery" title="Repair an unreadable case record." description="After a NEEDS_EVIDENCE result, each authenticated party may replace only its own evidence. The case allows two revisions before review is retried." steps={["Confirm the report is in NEEDS_EVIDENCE.", "Connect the reporter or accused unit wallet.", "Submit a stable HTTPS replacement, then run the jury again."]} />;
}
