import { ManualPage } from "@/components/imme/manual-page";

export const metadata = { title: "Planning Manual" };

export default function PlanningManualPage() {
  return (
    <ManualPage
      manualId="planning"
      toc={[
        {
          code: "1",
          title: "Appraisal",
          items: [
            { code: "1.1", title: "Traffic demand forecasting" },
            { code: "1.2", title: "Cost-benefit analysis" },
            { code: "1.3", title: "Economic & financial analysis" },
            { code: "1.4", title: "Multi-criteria evaluation" },
          ],
        },
        {
          code: "2",
          title: "Road Management System",
          items: [
            { code: "2.1", title: "MoWT Road Management System (RMS)" },
            { code: "2.2", title: "HDM-4 application" },
            { code: "2.3", title: "Programming & prioritization" },
          ],
        },
        {
          code: "3",
          title: "Project initiation",
          items: [
            { code: "3.1", title: "Pre-feasibility & feasibility studies" },
            { code: "3.2", title: "Stakeholder consultation" },
          ],
        },
      ]}
      description={
        <>
          <p>
            The Planning Manual establishes the procedures for justifying, prioritizing, and initiating expressway
            projects in Uganda. It walks the analyst from raw demand data to a defensible programming decision.
          </p>
          <p>
            Methods include traffic demand forecasting, cost-benefit and economic analysis, and multi-criteria
            evaluation — each tied to MoWT's existing Road Management System and HDM-4 toolchain so outputs
            integrate with current programming workflows.
          </p>
        </>
      }
      whyUganda={
        <>
          <p>
            Uganda's expressway pipeline is growing alongside ongoing donor-funded studies. Without a unified
            appraisal procedure, comparable projects are evaluated under inconsistent assumptions.
          </p>
          <p>
            This manual standardizes the decision basis so MoWT and partners can compare alternatives apples-to-apples
            and feed results directly into the country's RMS.
          </p>
        </>
      }
    />
  );
}
