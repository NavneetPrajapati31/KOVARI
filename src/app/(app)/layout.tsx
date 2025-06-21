import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto !p-2 !md:p-2">
        <SidebarTrigger className="hover:bg-gray-300 hover:text-black" />
        {/* The sidebar trigger is only for mobile and is included in the sidebar component. */}
        {/* <SidebarTrigger className="hover:bg-gray-300 hover:text-black" /> */}
        {children}
      </main>
    </SidebarProvider>
  );
}
