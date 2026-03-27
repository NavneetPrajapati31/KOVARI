import LayoutWrapper from "@/shared/components/layout/groups-layout-wrapper";

interface GroupsLayoutProps {
  children: React.ReactNode;
}

export default function GroupsLayout({ children }: GroupsLayoutProps) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
