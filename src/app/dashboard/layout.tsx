"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
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

const SidebarLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
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
    <Link className="rounded-lg px-3 py-2 hover:bg-muted" href="/dashboard/cierre" onClick={onNavigate}>
      Cierre del día
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

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-64 min-h-screen flex-col border-r bg-white px-4 py-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#234c4b]">PMG Metales</h2>
            <p className="text-xs text-muted-foreground">Dashboard comprador</p>
          </div>
          <SidebarLinks />
          <SidebarUser />
        </aside>

        <main className="flex-1 px-5 py-6 md:px-10">
          {/* Top bar */}
          <div className="mb-6 flex items-center justify-between md:hidden">
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
                  <p className="text-xs text-muted-foreground">Dashboard comprador</p>
                </div>
                <SidebarLinks onNavigate={() => setOpen(false)} />
                <div className="mt-auto pt-6">
                  <SidebarUser />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
