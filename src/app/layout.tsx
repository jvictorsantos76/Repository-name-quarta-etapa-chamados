import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import {
  DEFAULT_THEME_PREFERENCES,
  normalizarPreferenciasTema,
  THEME_BOOTSTRAP_SCRIPT,
} from "@/lib/theme/constants";
import type { PreferenciasTema } from "@/lib/theme/types";
import {
  createSupabaseServerClient,
  getSupabaseAccessToken,
} from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quarta Etapa Chamados",
  description: "Abertura, acompanhamento e gestão de chamados técnicos.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
  },
};

async function carregarPreferenciasIniciais(): Promise<PreferenciasTema> {
  const accessToken = await getSupabaseAccessToken();

  if (!accessToken) {
    return DEFAULT_THEME_PREFERENCES;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser(
      accessToken
    );

    if (userError || !userData.user) {
      return DEFAULT_THEME_PREFERENCES;
    }

    const { data } = await supabase
      .from("perfis")
      .select("tema_preferido, cor_preferida, fonte_escala")
      .eq("id", userData.user.id)
      .eq("ativo", true)
      .maybeSingle();

    return normalizarPreferenciasTema(data);
  } catch {
    return DEFAULT_THEME_PREFERENCES;
  }
}

function getTemaEfetivoInicial(temaPreferido: PreferenciasTema["tema_preferido"]) {
  return temaPreferido === "dark" ? "dark" : "light";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preferenciasIniciais = await carregarPreferenciasIniciais();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-theme={preferenciasIniciais.tema_preferido}
      data-theme-effective={getTemaEfetivoInicial(
        preferenciasIniciais.tema_preferido
      )}
      data-accent={preferenciasIniciais.cor_preferida}
      data-font-scale={preferenciasIniciais.fonte_escala}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <ThemeProvider initialPreferences={preferenciasIniciais}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
