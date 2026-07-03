"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BuyerLinks = ({
  onNavigate,
  showExpenses,
}: {
  onNavigate?: () => void;
  showExpenses?: boolean;
}) => (
  <nav className="flex flex-col gap-2 text-sm">
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard" onClick={onNavigate}>
      Dashboard
    </Link>
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/compras" onClick={onNavigate}>
      Compras
    </Link>
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/clientes" onClick={onNavigate}>
      Clientes
    </Link>
    {showExpenses ? (
      <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/gastos" onClick={onNavigate}>
        Gastos
      </Link>
    ) : null}
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/cierre" onClick={onNavigate}>
      Cierre del día
    </Link>
  </nav>
);

const AdminLinks = ({
  onNavigate,
  showCampaigns,
}: {
  onNavigate?: () => void;
  showCampaigns?: boolean;
}) => (
  <nav className="flex flex-col gap-2 text-sm">
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin/control" onClick={onNavigate}>
      Área de control
    </Link>
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin" onClick={onNavigate}>
      Administrador
    </Link>
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin/proveedores" onClick={onNavigate}>
      Proveedores
    </Link>
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin/clientes" onClick={onNavigate}>
      Clientes
    </Link>
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin/catalogo" onClick={onNavigate}>
      Catalogo
    </Link>
    {showCampaigns ? (
      <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin/campanas" onClick={onNavigate}>
        Campañas
      </Link>
    ) : null}
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/admin/metals" onClick={onNavigate}>
      Precios metales
    </Link>
  </nav>
);

const SidebarUser = () => {
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials =
    user?.fullName
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2) || "US";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mt-auto flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2 hover:bg-muted">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? "Usuario"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-medium text-[#234c4b]">
              {user?.fullName ?? "Usuario"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? ""}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user } = useUser();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const syncFromClerk = useMutation(api.users.syncFromClerk);

  const dbUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : "skip");
  const role = dbUser?.role;
  const isAdmin = role === "admin";
  const showPanamaCampaigns = dbUser?.role === "admin" && dbUser?.tenantKey === "pa";
  const showBuyerExpenses =
    dbUser?.role === "buyer" &&
    dbUser?.tenantKey === "pa" &&
    Array.isArray(dbUser?.features) &&
    dbUser.features.includes("buyer_expenses");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    syncFromClerk({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? undefined,
    }).catch((error) => {
      console.error("Error sincronizando usuario con Convex", error);
    });
  }, [syncFromClerk, user?.fullName, user?.id, user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    if (role === "admin" && pathname === "/dashboard") {
      router.replace("/dashboard/admin/control");
    }
  }, [role, pathname, router]);

  const title = useMemo(() => (isAdmin ? "Dashboard administrador" : "Dashboard comprador"), [isAdmin]);

  if (dbUser?.active === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] px-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#234c4b]">Acceso temporalmente bloqueado</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Tu usuario fue desactivado momentáneamente mientras el administrador revisa la operación.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Si necesitas claridad sobre el estado de tu cuenta, comunícate con administración.
          </p>
          <Button
            className="mt-6 bg-[#234c4b] text-white hover:bg-[#1e3f3e]"
            onClick={() => signOut({ redirectUrl: "/" })}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-screen flex-col border-r bg-white px-4 py-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#234c4b]">PMG Metales</h2>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
          {isAdmin ? <AdminLinks showCampaigns={showPanamaCampaigns} /> : <BuyerLinks showExpenses={showBuyerExpenses} />}
          {mounted ? (
            <SidebarUser />
          ) : (
            <div className="mt-auto h-14 rounded-xl border bg-white" />
          )}
        </aside>

        <main className="flex-1 px-5 py-6 md:px-10">
          <div className="mb-6 flex items-center justify-between md:hidden">
            {mounted ? (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 flex flex-col">
                  <SheetTitle className="sr-only">Menú</SheetTitle>
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-[#234c4b]">PMG Metales</h2>
                    <p className="text-xs text-muted-foreground">{title}</p>
                  </div>
                  {isAdmin ? (
                    <AdminLinks onNavigate={() => setOpen(false)} showCampaigns={showPanamaCampaigns} />
                  ) : (
                    <BuyerLinks onNavigate={() => setOpen(false)} showExpenses={showBuyerExpenses} />
                  )}
                  <div className="mt-auto pt-6">
                    <SidebarUser />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="outline" size="icon" disabled>
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
