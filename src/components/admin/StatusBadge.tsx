type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const styles: Record<string, string> = {
    Ny: "bg-blue-500/20 text-blue-300",
    Kontaktad: "bg-yellow-500/20 text-yellow-300",
    Bokad: "bg-green-500/20 text-green-300",
    Avslutad: "bg-red-500/20 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-gray-500/20 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}