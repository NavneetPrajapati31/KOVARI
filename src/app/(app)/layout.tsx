import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LayoutWrapper from "@/components/layout/app-layout-wrapper";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <LayoutWrapper>{children}</LayoutWrapper>
        {/* {children} */}
      </main>
    </SidebarProvider>
  );
}
