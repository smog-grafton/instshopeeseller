import PortalLayout from "@/components/portal-layout";
import { PortalAuthGuard } from "@/components/portal-auth-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthGuard>
      <PortalLayout>{children}</PortalLayout>
    </PortalAuthGuard>
  );
}
