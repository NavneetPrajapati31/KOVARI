import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { SidebarWrapper } from "@/shared/components/layout/sidebar-wrapper";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import LayoutWrapper from "@/shared/components/layout/app-layout-wrapper";
import ProtectedRoute from "@/shared/components/protected-route";
import DirectMessageListener from "@/shared/components/direct-message-listener";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DirectMessageListener />
      <ProtectedRoute>
        <SidebarProvider>
          {/* <SidebarWrapper /> */}
          <AppSidebar />
          <main className="flex-1 min-h-0 flex flex-col">
            {/* <LayoutWrapper>{children}</LayoutWrapper> */}
            {children}
            {/* {children} */}
          </main>
        </SidebarProvider>
      </ProtectedRoute>
    </>
  );
}
