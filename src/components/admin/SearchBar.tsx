"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({
  value,
  onChange,
}: Props) {
  return (
    <input
      type="text"
      placeholder="🔍 Sök kund, e-post eller ort..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white outline-none placeholder:text-slate-400 focus:border-purple-500"
    />
  );
}