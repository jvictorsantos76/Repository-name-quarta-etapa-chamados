"use client";

import {
  criarIntervaloAdicional,
  type DiaAtendimento,
} from "@/lib/agenda-semanal";

type Props = {
  agenda: DiaAtendimento[];
  onChange: (agenda: DiaAtendimento[]) => void;
  erro?: string;
};

const labelClass =
  "flex min-w-0 flex-col text-[11px] font-semibold text-gray-500";
const labelTextClass = "uppercase tracking-wide";
const auxiliaryTextClass =
  "mt-1 text-xs font-semibold normal-case tracking-normal text-gray-700";
const inputCompactClass =
  "mt-1 w-full min-w-0 rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 min-h-8";

export function AgendaSemanalAtendimento({ agenda, onChange, erro = "" }: Props) {
  function atualizarDia(
    diaSemana: number,
    atualizador: (dia: DiaAtendimento) => DiaAtendimento
  ) {
    onChange(
      agenda.map((dia) => (dia.dia_semana === diaSemana ? atualizador(dia) : dia))
    );
  }

  return (
    <div className="min-w-0 md:col-span-full">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-44 px-3 py-2">Dia</th>
              <th className="w-28 px-3 py-2 text-center">Fechado</th>
              <th className="px-3 py-2">Intervalos</th>
              <th className="w-20 px-3 py-2 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agenda.map((dia) => (
              <tr key={dia.dia_semana} className="align-top">
                <td className="px-3 py-3 font-semibold text-gray-950">{dia.label}</td>
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={dia.fechado}
                    onChange={(event) =>
                      atualizarDia(dia.dia_semana, (atual) => ({
                        ...atual,
                        fechado: event.currentTarget.checked,
                        intervalos: event.currentTarget.checked
                          ? []
                          : [{ abre_as: "09:00", fecha_as: "17:00" }],
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label={`${dia.label} fechado`}
                  />
                </td>
                <td className="px-3 py-3">
                  {dia.fechado ? (
                    <span className="inline-flex min-h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-500">
                      Sem atendimento
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {dia.intervalos.map((intervalo, index) => (
                        <div
                          key={`${dia.dia_semana}-${index}`}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                        >
                          <label className={labelClass}>
                            <span className={labelTextClass}>
                              {index === 0 ? "Abre às" : `${index + 1}º intervalo abre`}
                            </span>
                            <input
                              type="time"
                              value={intervalo.abre_as}
                              onChange={(event) =>
                                atualizarDia(dia.dia_semana, (atual) => ({
                                  ...atual,
                                  intervalos: atual.intervalos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, abre_as: event.currentTarget.value }
                                      : item
                                  ),
                                }))
                              }
                              className={inputCompactClass}
                            />
                            <span aria-hidden="true" className={auxiliaryTextClass} />
                          </label>
                          <label className={labelClass}>
                            <span className={labelTextClass}>
                              {index === 0 ? "Fecha às" : `${index + 1}º intervalo fecha`}
                            </span>
                            <input
                              type="time"
                              value={intervalo.fecha_as}
                              onChange={(event) =>
                                atualizarDia(dia.dia_semana, (atual) => ({
                                  ...atual,
                                  intervalos: atual.intervalos.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, fecha_as: event.currentTarget.value }
                                      : item
                                  ),
                                }))
                              }
                              className={inputCompactClass}
                            />
                            <span aria-hidden="true" className={auxiliaryTextClass} />
                          </label>
                          <button
                            type="button"
                            disabled={dia.intervalos.length === 1}
                            onClick={() =>
                              atualizarDia(dia.dia_semana, (atual) => ({
                                ...atual,
                                intervalos: atual.intervalos.filter(
                                  (_item, itemIndex) => itemIndex !== index
                                ),
                              }))
                            }
                            className="self-end rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    disabled={dia.fechado}
                    onClick={() =>
                      atualizarDia(dia.dia_semana, (atual) => ({
                        ...atual,
                        intervalos: [
                          ...atual.intervalos,
                          criarIntervaloAdicional(atual.intervalos),
                        ],
                      }))
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
                  >
                    + Intervalo
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {erro ? <p className="mt-2 text-sm font-semibold text-red-600">{erro}</p> : null}
    </div>
  );
}
