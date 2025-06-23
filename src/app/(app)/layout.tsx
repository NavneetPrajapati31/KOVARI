import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import LayoutWrapper from "@/components/layout/app-layout-wrapper";
import ProtectedRoute from "@/components/protected-route";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <SidebarWrapper />
        <main className="flex-1 flex flex-col min-h-screen">
          <LayoutWrapper>{children}</LayoutWrapper>
          {/* {children} */}
        </main>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
