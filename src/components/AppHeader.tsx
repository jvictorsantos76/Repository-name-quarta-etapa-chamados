import type { PerfilAutenticado } from "@/lib/auth/types";
import { LABEL_PAPEL_USUARIO } from "@/lib/auth/permissions";
import { AppHeaderClient } from "./AppHeaderClient";

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function AppHeader({ perfil }: { perfil: PerfilAutenticado }) {
  return (
    <AppHeaderClient
      perfil={{
        nomeCompleto: perfil.nome_completo,
        avatarUrl: perfil.avatar_url,
        papel: perfil.papel,
        papelLabel: perfil.cargo || LABEL_PAPEL_USUARIO[perfil.papel],
        iniciais: getIniciais(perfil.nome_completo),
      }}
    />
  );
}
