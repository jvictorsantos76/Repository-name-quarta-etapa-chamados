import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PapelUsuario, PerfilAutenticado } from "@/lib/auth/types";
import { SUPABASE_ACCESS_TOKEN_COOKIE } from "./constants";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuração do Supabase não encontrada.");
  }

  return { supabaseUrl, supabaseKey };
}

export async function getSupabaseAccessToken() {
  return (await cookies()).get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const accessToken = await getSupabaseAccessToken();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

function isPapelUsuario(papel: string): papel is PapelUsuario {
  return (
    papel === "admin" ||
    papel === "gestor" ||
    papel === "operador" ||
    papel === "analista" ||
    papel === "tecnico"
  );
}

export async function requirePerfilAutenticado() {
  const accessToken = await getSupabaseAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(
    accessToken
  );

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("perfis")
    .select("id, nome_completo, papel, ativo")
    .eq("id", userData.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (perfilError || !perfil || !isPapelUsuario(perfil.papel)) {
    redirect("/aguardando-aprovacao");
  }

  return perfil as PerfilAutenticado;
}

export async function requireAdminOuGestor() {
  const perfil = await requirePerfilAutenticado();

  if (perfil.papel !== "admin" && perfil.papel !== "gestor") {
    redirect("/");
  }

  return perfil;
}
