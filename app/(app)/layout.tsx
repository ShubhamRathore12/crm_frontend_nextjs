import { AppSidebar } from "@/components/app-sidebar";
import { PermissionProvider } from "@/components/auth/permission-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
      </div>
    </PermissionProvider>
  );
}
