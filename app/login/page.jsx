import { signIn } from "@/lib/actions";

export const metadata = { title: "Admin — Prestige Importaciones" };

export default async function AdminLoginPage({ searchParams }) {
  const sp = await searchParams;
  const error = sp?.error;

  return (
    <div className="pi-admin-login">
      <h1>Panel administrativo</h1>
      <p>Ingresa con el correo y la contraseña que creaste en Supabase Auth.</p>
      <form action={signIn}>
        <input type="email" name="email" placeholder="Correo" required />
        <input type="password" name="password" placeholder="Contraseña" required />
        <button className="btn btn-primary" type="submit">Entrar</button>
      </form>
      {error ? <div className="pi-error">{error}</div> : null}
    </div>
  );
}
