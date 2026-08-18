import {
  Document,
  Image,
  Page,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { pdfStyles as styles } from "./pdfStyles";
import {
  formatPdfDate,
  formatPdfDateTime,
  getTimeRange,
  safePdfText,
} from "./pdfHelpers";
import type { WorkOrderPdfData } from "./pdfTypes";

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

export function WorkOrderPdfDocument({
  data,
}: {
  data: WorkOrderPdfData;
}) {
  const companyName =
    data.company?.name?.trim() || "Fansixs";

  return (
    <Document
      title={`Arbetsrapport ${data.workOrderId}`}
      author={companyName}
      subject="Arbetsrapport"
      language="sv-SE"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.brand}>{companyName}</Text>

          <Text style={styles.title}>
            Arbetsrapport
          </Text>

          <Text style={styles.subtitle}>
            Arbetsorder #{data.workOrderId}
          </Text>

          <Text style={styles.statusBadge}>
            {safePdfText(data.status)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Kund och uppdrag
          </Text>

          <InfoRow
            label="Kund"
            value={safePdfText(data.customer.name)}
          />
          <InfoRow
            label="E-post"
            value={safePdfText(data.customer.email)}
          />
          <InfoRow
            label="Telefon"
            value={safePdfText(data.customer.phone)}
          />
          <InfoRow
            label="Ort"
            value={safePdfText(data.customer.city)}
          />
          <InfoRow
            label="Tjänst"
            value={safePdfText(data.booking.service)}
          />
          <InfoRow
            label="Datum"
            value={formatPdfDate(
              data.booking.bookingDate,
            )}
          />
          <InfoRow
            label="Tid"
            value={getTimeRange(
              data.booking.startTime,
              data.booking.endTime,
            )}
          />
          <InfoRow
            label="Utförd av"
            value={safePdfText(data.assignedTo)}
            last
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Arbetsrapport
          </Text>

          <Text style={styles.paragraph}>
            {safePdfText(
              data.aiSummary || data.notes,
              "Ingen arbetsrapport har registrerats.",
            )}
          </Text>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Tider
          </Text>

          <InfoRow
            label="Startad"
            value={formatPdfDateTime(
              data.startedAt,
            )}
          />
          <InfoRow
            label="Slutförd"
            value={formatPdfDateTime(
              data.completedAt,
            )}
            last
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Checklista
          </Text>

          {data.checklist.length === 0 ? (
            <Text style={styles.emptyText}>
              Ingen checklista registrerad.
            </Text>
          ) : (
            data.checklist.map((item, index) => (
              <View
                key={`${item.title}-${index}`}
                style={styles.checklistItem}
              >
                <Text
                  style={[
                    styles.checklistMark,
                    item.completed
                      ? styles.checklistMarkComplete
                      : {},
                  ]}
                >
                  {item.completed ? "✓" : ""}
                </Text>

                <Text style={styles.checklistText}>
                  {item.title}
                </Text>
              </View>
            ))
          )}
        </View>

        {data.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Bilder från arbetet
            </Text>

            <View style={styles.imageGrid}>
              {data.images.map((image, index) => (
                <View
                  key={`${image.url}-${index}`}
                  style={styles.imageCard}
                  wrap={false}
                >
                  <Image
                    src={image.url}
                    style={styles.image}
                  />

                  <Text style={styles.imageLabel}>
                    {safePdfText(
                      image.type,
                      `Bild ${index + 1}`,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Kundgodkännande
          </Text>

          {data.customerSignature ? (
            <>
              <Image
                src={data.customerSignature}
                style={styles.signature}
              />

              <Text style={styles.signatureLine}>
                Kundsignatur ·{" "}
                {formatPdfDateTime(data.signedAt)}
              </Text>
            </>
          ) : (
            <Text style={styles.emptyText}>
              Ingen kundsignatur registrerad.
            </Text>
          )}
        </View>

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

export async function renderWorkOrderPdf(
  data: WorkOrderPdfData,
) {
  return renderToBuffer(
    <WorkOrderPdfDocument data={data} />,
  );
}
