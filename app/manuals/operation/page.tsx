import { ManualPage } from "@/components/imme/manual-page";

export const metadata = { title: "Operation Manual" };

export default function OperationManualPage() {
  return (
    <ManualPage
      manualId="operation"
      toc={[
        { code: "1", title: "Traffic management", items: [
          { code: "1.1", title: "Traffic Control Room" },
          { code: "1.2", title: "Variable Message Signs (VMS)" },
          { code: "1.3", title: "Safety patrol" },
          { code: "1.4", title: "Information services" },
        ]},
        { code: "2", title: "Disaster management", items: [
          { code: "2.1", title: "Incident response" },
          { code: "2.2", title: "Severe weather & flooding" },
        ]},
        { code: "3", title: "Auxiliary management", items: [
          { code: "3.1", title: "Customer care" },
          { code: "3.2", title: "Service areas" },
        ]},
      ]}
      description={
        <>
          <p>
            The Operation Manual covers daily expressway operations — traffic control room procedures, VMS use,
            safety patrols, disaster response, customer care, and service areas. It is the playbook for the
            operator who keeps an expressway running safely.
          </p>
        </>
      }
      whyUganda={
        <>
          <p>
            As Uganda transitions from limited-access roads to true expressways, operational practices need to
            scale: 24×7 control room workflows, organized incident response, and consistent customer-facing
            services. This manual sets the local standard.
          </p>
        </>
      }
    />
  );
}
