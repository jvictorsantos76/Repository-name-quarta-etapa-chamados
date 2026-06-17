export type IntervaloAtendimento = {
  abre_as: string;
  fecha_as: string;
};

export type DiaAtendimento = {
  dia_semana: number;
  label: string;
  fechado: boolean;
  intervalos: IntervaloAtendimento[];
};

export type HorarioAtendimentoSerializado = {
  dia_semana: number;
  fechado: boolean;
  abre_as: string | null;
  fecha_as: string | null;
  ordem: number;
};

export type HorarioAtendimentoFonte = {
  dia_semana: number;
  fechado: boolean;
  abre_as: string | null;
  fecha_as: string | null;
  ordem: number;
};

export const DIAS_ATENDIMENTO = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function horarioCurto(valor: string | null | undefined) {
  const texto = String(valor ?? "").trim();
  return /^\d{2}:\d{2}:\d{2}$/.test(texto) ? texto.slice(0, 5) : texto;
}

export function criarAgendaAtendimentoPadrao(): DiaAtendimento[] {
  return DIAS_ATENDIMENTO.map((label, dia_semana) => {
    const fechado = dia_semana === 0 || dia_semana === 6;

    return {
      dia_semana,
      label,
      fechado,
      intervalos: fechado ? [] : [{ abre_as: "09:00", fecha_as: "17:00" }],
    };
  });
}

export function montarAgendaAtendimentoInicial(
  horarios: HorarioAtendimentoFonte[] | undefined
) {
  if (!horarios?.length) {
    return criarAgendaAtendimentoPadrao();
  }

  return DIAS_ATENDIMENTO.map((label, dia_semana) => {
    const registros = horarios
      .filter((horario) => horario.dia_semana === dia_semana)
      .sort((a, b) => a.ordem - b.ordem);
    const fechado = registros.some((horario) => horario.fechado);

    if (fechado) {
      return {
        dia_semana,
        label,
        fechado: true,
        intervalos: [],
      };
    }

    const intervalos = registros
      .filter((horario) => horario.abre_as && horario.fecha_as)
      .map((horario) => ({
        abre_as: horarioCurto(horario.abre_as),
        fecha_as: horarioCurto(horario.fecha_as),
      }));

    return {
      dia_semana,
      label,
      fechado: intervalos.length === 0,
      intervalos,
    };
  });
}

export function serializarAgendaAtendimento(
  agenda: DiaAtendimento[]
): HorarioAtendimentoSerializado[] {
  return agenda.flatMap<HorarioAtendimentoSerializado>((dia) =>
    dia.fechado
      ? [
          {
            dia_semana: dia.dia_semana,
            fechado: true,
            abre_as: null,
            fecha_as: null,
            ordem: 1,
          },
        ]
      : dia.intervalos.map((intervalo, index) => ({
          dia_semana: dia.dia_semana,
          fechado: false,
          abre_as: intervalo.abre_as,
          fecha_as: intervalo.fecha_as,
          ordem: index + 1,
        }))
  );
}

export function horarioEmMinutos(valor: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(valor);

  if (!match) {
    return null;
  }

  const horas = Number(match[1]);
  const minutos = Number(match[2]);

  if (horas > 23 || minutos > 59) {
    return null;
  }

  return horas * 60 + minutos;
}

export function formatarHorarioMinutos(totalMinutos: number) {
  const horas = Math.floor(totalMinutos / 60).toString().padStart(2, "0");
  const minutos = (totalMinutos % 60).toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

export function criarIntervaloAdicional(intervalos: IntervaloAtendimento[]) {
  const ultimo = intervalos[intervalos.length - 1];
  const fimAnterior = ultimo ? horarioEmMinutos(ultimo.fecha_as) : null;

  if (fimAnterior !== null && fimAnterior <= 22 * 60) {
    return {
      abre_as: formatarHorarioMinutos(fimAnterior),
      fecha_as: formatarHorarioMinutos(fimAnterior + 60),
    };
  }

  return { abre_as: "13:00", fecha_as: "17:00" };
}

export function validarAgendaAtendimento(agenda: DiaAtendimento[]) {
  for (const dia of agenda) {
    if (dia.fechado) {
      continue;
    }

    if (dia.intervalos.length === 0) {
      return `Informe ao menos um intervalo para ${dia.label}.`;
    }

    const ordenados = [...dia.intervalos].sort((a, b) => {
      const inicioA = horarioEmMinutos(a.abre_as) ?? 0;
      const inicioB = horarioEmMinutos(b.abre_as) ?? 0;
      return inicioA - inicioB;
    });

    for (let index = 0; index < ordenados.length; index += 1) {
      const intervalo = ordenados[index];
      const inicio = horarioEmMinutos(intervalo.abre_as);
      const fim = horarioEmMinutos(intervalo.fecha_as);

      if (inicio === null || fim === null) {
        return `Informe abertura e fechamento para ${dia.label}.`;
      }

      if (fim <= inicio) {
        return `Em ${dia.label}, o fechamento deve ser maior que a abertura.`;
      }

      const anterior = ordenados[index - 1];
      const fimAnterior = anterior ? horarioEmMinutos(anterior.fecha_as) : null;

      if (fimAnterior !== null && inicio < fimAnterior) {
        return `Em ${dia.label}, os intervalos não podem se sobrepor.`;
      }
    }
  }

  return "";
}
