import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen w-full px-4 pt-28 pb-16 md:pt-36 flex justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-[#234c4b]">Registro deshabilitado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta aplicación es privada. Solicita al administrador la creación de tu usuario.
          </p>
          <Link
            href="/sign-in"
            className="mt-4 inline-flex rounded-md bg-[#234c4b] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e3f3e]"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
