"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeContext } from "@/components/theme/ThemeProvider";
import type { PerfilAutenticado } from "@/lib/auth/types";
import type {
  CorPreferida,
  FonteEscala,
  TemaPreferido,
} from "@/lib/theme/types";
import { atualizarPreferenciasPerfil } from "@/app/perfil/actions";

type PreferenciasPerfil = {
  tema_preferido: TemaPreferido;
  cor_preferida: CorPreferida;
  fonte_escala: FonteEscala;
};

const OPCOES_TEMA: Array<{ valor: TemaPreferido; label: string }> = [
  { valor: "system", label: "Sistema" },
  { valor: "light", label: "Claro" },
  { valor: "dark", label: "Escuro" },
];

const OPCOES_COR: Array<{ valor: CorPreferida; label: string }> = [
  { valor: "quarta-etapa", label: "Azul Quarta Etapa" },
  { valor: "verde", label: "Verde" },
  { valor: "roxo", label: "Roxo" },
  { valor: "laranja", label: "Laranja" },
  { valor: "neutro", label: "Cinza/neutro" },
];

const OPCOES_FONTE: Array<{ valor: FonteEscala; label: string }> = [
  { valor: "padrao", label: "Padrão" },
  { valor: "grande", label: "Grande" },
  { valor: "extra_grande", label: "Extra grande" },
];

export function AparenciaForm({ perfil }: { perfil: PerfilAutenticado }) {
  const router = useRouter();
  const { setPreferencias: setPreferenciasGlobais } = useContext(ThemeContext);
  const [preferencias, setPreferencias] = useState<PreferenciasPerfil>({
    tema_preferido: perfil.tema_preferido ?? "system",
    cor_preferida: perfil.cor_preferida ?? "quarta-etapa",
    fonte_escala: perfil.fonte_escala ?? "padrao",
  });
  const [mensagem, setMensagem] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [salvando, setSalvando] = useState(false);

  function alterarPreferencia(proximasPreferencias: PreferenciasPerfil) {
    setPreferencias(proximasPreferencias);
    setPreferenciasGlobais(proximasPreferencias);
    setStatus("idle");
    setMensagem("Salvando preferências...");
    setSalvando(true);

    void atualizarPreferenciasPerfil(proximasPreferencias)
      .then((resultado) => {
        if (resultado.status === "success") {
          setStatus("success");
          setMensagem("Preferências salvas.");
          router.refresh();
          return;
        }

        setStatus("error");
        setMensagem(resultado.message);
      })
      .finally(() => {
        setSalvando(false);
      });
  }

  const mensagemClasse =
    status === "success"
      ? "text-emerald-700"
      : status === "error"
        ? "text-red-700"
        : "text-gray-600";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">
              Preferências visuais
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Mudanças de tema, cor e fonte são aplicadas imediatamente e salvas
              automaticamente no seu perfil.
            </p>
          </div>
          <span className="w-fit rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
            Auto save
          </span>
        </div>

        <div className="mt-6 grid gap-6">
          <GrupoBotoesPreferencia
            label="Tema"
            opcoes={OPCOES_TEMA}
            valorAtual={preferencias.tema_preferido}
            disabled={salvando}
            onSelect={(tema) =>
              alterarPreferencia({
                ...preferencias,
                tema_preferido: tema as TemaPreferido,
              })
            }
          />

          <div>
            <p className="text-sm font-semibold text-gray-950">
              Cor de destaque
            </p>
            <div
              className="mt-3 grid gap-3"
              role="group"
              aria-label="Cor de destaque"
            >
              {OPCOES_COR.map((opcao) => {
                const ativo = preferencias.cor_preferida === opcao.valor;

                return (
                  <button
                    key={opcao.valor}
                    type="button"
                    disabled={salvando}
                    aria-pressed={ativo}
                    onClick={() =>
                      alterarPreferencia({
                        ...preferencias,
                        cor_preferida: opcao.valor,
                      })
                    }
                    className={`perfil-color-choice min-h-12 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      ativo
                        ? "perfil-choice-active"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    data-color={opcao.valor}
                  >
                    <span className="flex items-center gap-3">
                      <span aria-hidden="true" className="perfil-color-dot" />
                      {opcao.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <GrupoBotoesPreferencia
            label="Tamanho da fonte"
            opcoes={OPCOES_FONTE}
            valorAtual={preferencias.fonte_escala}
            disabled={salvando}
            onSelect={(fonte) =>
              alterarPreferencia({
                ...preferencias,
                fonte_escala: fonte as FonteEscala,
              })
            }
          />

          <p className={`text-sm font-medium ${mensagemClasse}`} aria-live="polite">
            {salvando ? "Salvando preferências..." : mensagem}
          </p>
        </div>
      </section>

      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950">Padrão técnico</h2>
        <div className="mt-4 space-y-4 text-sm leading-6 text-gray-600">
          <p>
            O auto save fica restrito a preferências visuais reversíveis e de
            baixo impacto.
          </p>
          <p>
            Dados pessoais, permissões, chamados, evidências e histórico devem
            continuar com botão Salvar e validação explícita.
          </p>
          <p>
            Para ampliar o padrão no futuro, o sistema deve ter debounce,
            rollback visual, estados de salvamento e registro claro de falhas.
          </p>
        </div>
      </aside>
    </div>
  );
}

function GrupoBotoesPreferencia<TValor extends string>({
  label,
  opcoes,
  valorAtual,
  disabled,
  onSelect,
}: {
  label: string;
  opcoes: Array<{ valor: TValor; label: string }>;
  valorAtual: TValor;
  disabled: boolean;
  onSelect: (valor: TValor) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-950">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={label}>
        {opcoes.map((opcao) => {
          const ativo = valorAtual === opcao.valor;

          return (
            <button
              key={opcao.valor}
              type="button"
              disabled={disabled}
              aria-pressed={ativo}
              onClick={() => onSelect(opcao.valor)}
              className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                ativo
                  ? "perfil-choice-active"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opcao.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
