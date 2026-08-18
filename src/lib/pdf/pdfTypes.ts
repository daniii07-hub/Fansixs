export type WorkOrderPdfChecklistItem = {
  title: string;
  completed: boolean;
};

export type WorkOrderPdfImage = {
  url: string;
  type?: string | null;
};

export type WorkOrderPdfData = {
  workOrderId: number;
  status: string;

  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
  };

  booking: {
    service: string;
    bookingDate: string;
    startTime: string;
    endTime?: string | null;
  };

  assignedTo?: string | null;
  notes?: string | null;
  aiSummary?: string | null;

  checklist: WorkOrderPdfChecklistItem[];
  images: WorkOrderPdfImage[];

  customerSignature?: string | null;
  signedAt?: string | null;

  startedAt?: string | null;
  completedAt?: string | null;

  company?: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    organizationNumber?: string | null;
  };
};
