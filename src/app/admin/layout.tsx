import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-zinc-50 dark:bg-zinc-950 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex w-full min-w-0 flex-1 flex-col pt-12 lg:pt-0">{children}</div>
    </div>
  );
}
