import type {
  DashboardStats,
  Lead,
} from "../types";

function getStartOfToday(referenceDate: Date) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
}

function getStartOfWeek(referenceDate: Date) {
  const startOfToday =
    getStartOfToday(referenceDate);

  const startOfWeek =
    new Date(startOfToday);

  const day = startOfWeek.getDay();
  const diffToMonday =
    day === 0 ? 6 : day - 1;

  startOfWeek.setDate(
    startOfWeek.getDate() - diffToMonday,
  );

  return startOfWeek;
}

export function calculateDashboardStats(
  leads: Lead[],
  referenceDate = new Date(),
): DashboardStats {
  const startOfToday =
    getStartOfToday(referenceDate);

  const startOfWeek =
    getStartOfWeek(referenceDate);

  const leadsToday = leads.filter(
    (lead) =>
      new Date(lead.created_at) >= startOfToday,
  ).length;

  const leadsThisWeek = leads.filter(
    (lead) =>
      new Date(lead.created_at) >= startOfWeek,
  ).length;

  const bookedLeads = leads.filter(
    (lead) => lead.status === "Bokad",
  ).length;

  const newLeads = leads.filter(
    (lead) => lead.status === "Ny",
  ).length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "Kontaktad",
  ).length;

  const conversionRate =
    leads.length > 0
      ? Math.round(
          (bookedLeads / leads.length) * 100,
        )
      : 0;

  return {
    totalLeads: leads.length,
    leadsToday,
    leadsThisWeek,
    bookedLeads,
    newLeads,
    contactedLeads,
    conversionRate,
  };
}