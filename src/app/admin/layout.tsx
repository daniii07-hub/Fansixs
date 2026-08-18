import type { ReactNode } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#060914] text-white">
      <div className="flex min-h-screen w-full min-w-0 bg-[#060914]">
        <Sidebar />

        <div className="min-w-0 flex-1 overflow-x-hidden bg-[#060914]">
          <Topbar />

          <main className="min-w-0 overflow-x-hidden bg-[#060914]">
            <div className="w-full min-w-0 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}