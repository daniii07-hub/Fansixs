import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingRight: 38,
    paddingBottom: 50,
    paddingLeft: 38,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#172033",
    backgroundColor: "#ffffff",
  },

  header: {
    marginBottom: 22,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#5b21b6",
  },

  brand: {
    fontSize: 10,
    fontWeight: 700,
    color: "#ddd6fe",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 700,
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 10,
    color: "#ede9fe",
  },

  section: {
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 700,
    color: "#4c1d95",
  },

  row: {
    display: "flex",
    flexDirection: "row",
    paddingTop: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  label: {
    width: "34%",
    color: "#64748b",
  },

  value: {
    width: "66%",
    fontWeight: 600,
    color: "#172033",
  },

  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#334155",
  },

  checklistItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  checklistMark: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 3,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 1.4,
  },

  checklistMarkComplete: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
    color: "#166534",
  },

  checklistText: {
    flexGrow: 1,
    color: "#334155",
  },

  imageGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  imageCard: {
    width: "48%",
    marginBottom: 10,
  },

  image: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 8,
  },

  imageLabel: {
    marginTop: 4,
    fontSize: 8,
    color: "#64748b",
  },

  signature: {
    width: 220,
    height: 95,
    objectFit: "contain",
    backgroundColor: "#ffffff",
  },

  signatureLine: {
    marginTop: 8,
    paddingTop: 5,
    width: 240,
    borderTopWidth: 1,
    borderTopColor: "#64748b",
    fontSize: 9,
    color: "#64748b",
  },

  footer: {
    position: "absolute",
    right: 38,
    bottom: 22,
    left: 38,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 8,
    color: "#94a3b8",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingTop: 5,
    paddingRight: 9,
    paddingBottom: 5,
    paddingLeft: 9,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
    color: "#5b21b6",
    fontSize: 9,
    fontWeight: 700,
  },

  emptyText: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
