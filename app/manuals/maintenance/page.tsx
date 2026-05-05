import { ManualPage } from "@/components/imme/manual-page";

export const metadata = { title: "Maintenance Manual" };

export default function MaintenanceManualPage() {
  return (
    <ManualPage
      manualId="maintenance"
      toc={[
        { code: "V1", title: "Pavement maintenance", items: [
          { code: "V1.1", title: "Inspection & condition surveys" },
          { code: "V1.2", title: "Repair & rehabilitation" },
        ]},
        { code: "V2", title: "Bridge maintenance", items: [
          { code: "V2.1", title: "Routine, periodic & precise inspections" },
          { code: "V2.2", title: "Reinforcement & repair" },
          { code: "V2.3", title: "Linkage with the BMS" },
        ]},
        { code: "V3", title: "Drainage & slope maintenance" },
        { code: "V4", title: "Road furniture maintenance" },
        { code: "V5", title: "Tunnel maintenance" },
        { code: "X", title: "Annual budgeting & KPIs", items: [
          { code: "X.1", title: "Annual maintenance budgeting" },
          { code: "X.2", title: "Performance indices & reporting" },
        ]},
      ]}
      description={
        <>
          <p>
            The Maintenance Manual is delivered as five volumes — Pavement, Bridge, Drainage + Slope, Road Furniture,
            and Tunnel — with a cross-cutting section on annual maintenance budgeting and performance indices.
          </p>
          <p>
            The Bridge volume integrates directly with the Bridge Management System (BMS) so inspection findings
            on Kampala–Entebbe Expressway flow into prioritized maintenance planning.
          </p>
        </>
      }
      whyUganda={
        <>
          <p>
            Maintenance budgets are the most under-funded layer of road asset management when guidance is missing.
            This manual gives MoWT a defensible, data-backed annual budgeting process tied to inspection KPIs.
          </p>
        </>
      }
    />
  );
}
