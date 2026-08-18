import {
  Document,
  Page,
  Text,
  View,
  renderToBuffer,
  StyleSheet,
} from "@react-pdf/renderer";
import { pdfStyles as styles } from "./pdfStyles";
import {
  formatPdfDate,
  safePdfText,
} from "./pdfHelpers";

export type InvoicePdfItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type InvoicePdfData = {
  id: number;
  invoiceNumber?: string | null;
  status: string;

  invoiceDate: string;
  dueDate?: string | null;

  customer: {
    name: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
  };

  items: InvoicePdfItem[];

  subtotal: number;
  vatAmount: number;
  deductionType?: "RUT" | "ROT" | null;
  deductionAmount: number;
  totalAmount: number;

  notes?: string | null;

  company?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    organizationNumber?: string | null;
    bankgiro?: string | null;
    plusgiro?: string | null;
    swish?: string | null;
  };
};

const invoiceStyles = StyleSheet.create({
  columns: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  column: {
    flexGrow: 1,
    width: "50%",
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },

  columnTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
    color: "#4c1d95",
  },

  smallText: {
    marginBottom: 4,
    fontSize: 9,
    color: "#475569",
  },

  invoiceTable: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
  },

  tableHeader: {
    display: "flex",
    flexDirection: "row",
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },

  tableRow: {
    display: "flex",
    flexDirection: "row",
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },

  tableRowLast: {
    borderBottomWidth: 0,
  },

  descriptionColumn: {
    width: "44%",
    paddingRight: 6,
  },

  quantityColumn: {
    width: "12%",
    paddingRight: 6,
    textAlign: "right",
  },

  priceColumn: {
    width: "18%",
    paddingRight: 6,
    textAlign: "right",
  },

  vatColumn: {
    width: "10%",
    paddingRight: 6,
    textAlign: "right",
  },

  amountColumn: {
    width: "16%",
    textAlign: "right",
  },

  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#475569",
  },

  tableText: {
    fontSize: 9,
    color: "#334155",
  },

  summaryWrap: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },

  summary: {
    width: 250,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
  },

  summaryRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
  },

  summaryValue: {
    fontSize: 9,
    fontWeight: 700,
    color: "#172033",
  },

  summaryTotal: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#86efac",
  },

  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#166534",
  },

  totalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#166534",
  },

  paymentBox: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },

  paymentTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
    color: "#4c1d95",
  },

  paymentGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },

  paymentItem: {
    width: "50%",
    marginBottom: 5,
    fontSize: 9,
    color: "#475569",
  },

  notes: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },

  notesTitle: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
    color: "#4c1d95",
  },

  notesText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#475569",
  },
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function calculateRowAmount(item: InvoicePdfItem) {
  return item.quantity * item.unitPrice;
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        last ? styles.rowLast : {},
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function InvoicePdfDocument({
  data,
}: {
  data: InvoicePdfData;
}) {
  const companyName =
    data.company?.name?.trim() || "Fansixs";

  const invoiceTitle = data.invoiceNumber
    ? `Faktura ${data.invoiceNumber}`
    : `Fakturautkast #${data.id}`;

  return (
    <Document
      title={invoiceTitle}
      author={companyName}
      subject="Faktura"
      language="sv-SE"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.brand}>
            {companyName}
          </Text>

          <Text style={styles.title}>
            Faktura
          </Text>

          <Text style={styles.subtitle}>
            {invoiceTitle}
          </Text>

          <Text style={styles.statusBadge}>
            {safePdfText(data.status)}
          </Text>
        </View>

        <View style={invoiceStyles.columns}>
          <View style={invoiceStyles.column}>
            <Text style={invoiceStyles.columnTitle}>
              Fakturautställare
            </Text>

            <Text style={invoiceStyles.smallText}>
              {companyName}
            </Text>

            {data.company?.organizationNumber && (
              <Text style={invoiceStyles.smallText}>
                Org.nr:{" "}
                {data.company.organizationNumber}
              </Text>
            )}

            {data.company?.email && (
              <Text style={invoiceStyles.smallText}>
                E-post: {data.company.email}
              </Text>
            )}

            {data.company?.phone && (
              <Text style={invoiceStyles.smallText}>
                Telefon: {data.company.phone}
              </Text>
            )}

            {data.company?.website && (
              <Text style={invoiceStyles.smallText}>
                Webb: {data.company.website}
              </Text>
            )}
          </View>

          <View style={invoiceStyles.column}>
            <Text style={invoiceStyles.columnTitle}>
              Fakturamottagare
            </Text>

            <Text style={invoiceStyles.smallText}>
              {safePdfText(data.customer.name)}
            </Text>

            {data.customer.email && (
              <Text style={invoiceStyles.smallText}>
                E-post: {data.customer.email}
              </Text>
            )}

            {data.customer.phone && (
              <Text style={invoiceStyles.smallText}>
                Telefon: {data.customer.phone}
              </Text>
            )}

            {data.customer.city && (
              <Text style={invoiceStyles.smallText}>
                Ort: {data.customer.city}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Fakturainformation
          </Text>

          <InfoRow
            label="Fakturadatum"
            value={formatPdfDate(
              data.invoiceDate,
            )}
          />

          <InfoRow
            label="Förfallodatum"
            value={formatPdfDate(
              data.dueDate ?? null,
            )}
          />

          <InfoRow
            label="Faktura-ID"
            value={String(data.id)}
            last
          />
        </View>

        <View style={invoiceStyles.invoiceTable}>
          <View style={invoiceStyles.tableHeader}>
            <Text
              style={[
                invoiceStyles.descriptionColumn,
                invoiceStyles.tableHeaderText,
              ]}
            >
              Beskrivning
            </Text>

            <Text
              style={[
                invoiceStyles.quantityColumn,
                invoiceStyles.tableHeaderText,
              ]}
            >
              Antal
            </Text>

            <Text
              style={[
                invoiceStyles.priceColumn,
                invoiceStyles.tableHeaderText,
              ]}
            >
              À-pris
            </Text>

            <Text
              style={[
                invoiceStyles.vatColumn,
                invoiceStyles.tableHeaderText,
              ]}
            >
              Moms
            </Text>

            <Text
              style={[
                invoiceStyles.amountColumn,
                invoiceStyles.tableHeaderText,
              ]}
            >
              Belopp
            </Text>
          </View>

          {data.items.length === 0 ? (
            <View
              style={[
                invoiceStyles.tableRow,
                invoiceStyles.tableRowLast,
              ]}
            >
              <Text style={styles.emptyText}>
                Fakturan saknar fakturarader.
              </Text>
            </View>
          ) : (
            data.items.map((item, index) => (
              <View
                key={`${item.description}-${index}`}
                style={[
                  invoiceStyles.tableRow,
                  index === data.items.length - 1
                    ? invoiceStyles.tableRowLast
                    : {},
                ]}
                wrap={false}
              >
                <Text
                  style={[
                    invoiceStyles.descriptionColumn,
                    invoiceStyles.tableText,
                  ]}
                >
                  {safePdfText(item.description)}
                </Text>

                <Text
                  style={[
                    invoiceStyles.quantityColumn,
                    invoiceStyles.tableText,
                  ]}
                >
                  {formatQuantity(item.quantity)}
                </Text>

                <Text
                  style={[
                    invoiceStyles.priceColumn,
                    invoiceStyles.tableText,
                  ]}
                >
                  {formatCurrency(item.unitPrice)}
                </Text>

                <Text
                  style={[
                    invoiceStyles.vatColumn,
                    invoiceStyles.tableText,
                  ]}
                >
                  {item.vatRate}%
                </Text>

                <Text
                  style={[
                    invoiceStyles.amountColumn,
                    invoiceStyles.tableText,
                  ]}
                >
                  {formatCurrency(
                    calculateRowAmount(item),
                  )}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={invoiceStyles.summaryWrap}>
          <View style={invoiceStyles.summary}>
            <View style={invoiceStyles.summaryRow}>
              <Text style={invoiceStyles.summaryLabel}>
                Delsumma
              </Text>

              <Text style={invoiceStyles.summaryValue}>
                {formatCurrency(data.subtotal)}
              </Text>
            </View>

            <View style={invoiceStyles.summaryRow}>
              <Text style={invoiceStyles.summaryLabel}>
                Moms
              </Text>

              <Text style={invoiceStyles.summaryValue}>
                {formatCurrency(data.vatAmount)}
              </Text>
            </View>

            {data.deductionType && (
              <View style={invoiceStyles.summaryRow}>
                <Text style={invoiceStyles.summaryLabel}>
                  {data.deductionType}-avdrag
                </Text>

                <Text style={invoiceStyles.summaryValue}>
                  −{formatCurrency(
                    data.deductionAmount,
                  )}
                </Text>
              </View>
            )}

            <View style={invoiceStyles.summaryTotal}>
              <Text style={invoiceStyles.totalLabel}>
                Att betala
              </Text>

              <Text style={invoiceStyles.totalValue}>
                {formatCurrency(data.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={invoiceStyles.paymentBox} wrap={false}>
          <Text style={invoiceStyles.paymentTitle}>
            Betalningsinformation
          </Text>

          <View style={invoiceStyles.paymentGrid}>
            {data.company?.bankgiro && (
              <Text style={invoiceStyles.paymentItem}>
                Bankgiro: {data.company.bankgiro}
              </Text>
            )}

            {data.company?.plusgiro && (
              <Text style={invoiceStyles.paymentItem}>
                Plusgiro: {data.company.plusgiro}
              </Text>
            )}

            {data.company?.swish && (
              <Text style={invoiceStyles.paymentItem}>
                Swish: {data.company.swish}
              </Text>
            )}

            <Text style={invoiceStyles.paymentItem}>
              Referens: Faktura {data.id}
            </Text>
          </View>
        </View>

        {data.notes && (
          <View style={invoiceStyles.notes} wrap={false}>
            <Text style={invoiceStyles.notesTitle}>
              Anteckningar
            </Text>

            <Text style={invoiceStyles.notesText}>
              {data.notes}
            </Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>
            {companyName}
            {data.company?.organizationNumber
              ? ` · Org.nr ${data.company.organizationNumber}`
              : ""}
          </Text>

          <Text
            render={({ pageNumber, totalPages }) =>
              `Sida ${pageNumber} av ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(
  data: InvoicePdfData,
) {
  return renderToBuffer(
    <InvoicePdfDocument data={data} />,
  );
}