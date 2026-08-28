import SuperAdminLoginClient from "./SuperAdminLoginClient";

export const metadata = {
  title: "N-Autos | Acceso Superadmin",
  description: "Panel de inicio de sesión exclusivo para Superadministrador global.",
};

export default function SuperAdminLoginPage() {
  return <SuperAdminLoginClient />;
}
