export type Lead = {
  id: number;
  created_at: string;
  name: string;
  service: string;
  city: string;
  status: string;
};

export type DashboardStats = {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  bookedLeads: number;
  newLeads: number;
  contactedLeads: number;
  conversionRate: number;
};

export type DashboardBusinessStats = {
  revenueThisMonth: number;
  unpaidInvoiceCount: number;
  unpaidInvoiceAmount: number;
  newLeadsThisMonth: number;
  jobsToday: number;
};

export type RecentInvoice = {
  id: number;
  invoice_number: string | null;
  customer_name: string;
  invoice_date: string;
  total_amount: number;
  status: string;
};

export type MonthlyChartPoint = {
  label: string;
  value: number;
};

export type InvoiceStatusChartPoint = {
  label: string;
  value: number;
};

export type DashboardChartsData = {
  revenueByMonth: MonthlyChartPoint[];
  leadsByMonth: MonthlyChartPoint[];
  invoiceStatus: InvoiceStatusChartPoint[];
};

export type ActivityType =
  | "lead_created"
  | "invoice_created"
  | "invoice_sent"
  | "work_order_completed"
  | "signature_added"
  | "ai_generated";

export type DashboardActivity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  href?: string | null;
};

export type CalendarEvent = {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  customerName: string;
  service: string;
  city: string | null;
  assignedTo: string | null;
  status: string;
  href?: string | null;
};

export type DashboardData = {
  leads: Lead[];
  recentLeads: Lead[];
  recentInvoices: RecentInvoice[];
  stats: DashboardStats;
  businessStats: DashboardBusinessStats;
  charts: DashboardChartsData;
  activities: DashboardActivity[];
  calendarEvents: CalendarEvent[];
};