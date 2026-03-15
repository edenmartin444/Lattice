import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:hidden">
          <MobileSidebar />
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Lattice</span>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
