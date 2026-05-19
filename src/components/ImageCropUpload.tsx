"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type UploadStatus = "idle" | "success" | "error";

type ImageCropUploadProps = {
  id: string;
  label: string;
  imageUrl: string;
  fallbackText: string;
  helper: string;
  disabled?: boolean;
  uploading?: boolean;
  mensagem?: string;
  status?: UploadStatus;
  buttonLabel?: string;
  previewSizeClassName?: string;
  onUpload: (file: File) => Promise<void>;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp";

function obterExtensao(nomeArquivo: string) {
  return nomeArquivo.split(".").pop()?.toLowerCase() ?? "";
}

function formatarTamanho(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validarArquivoImagem(file: File) {
  const extensao = obterExtensao(file.name);

  if (!ACCEPTED_EXTENSIONS.has(extensao)) {
    return "Envie uma imagem JPG, PNG ou WEBP.";
  }

  if (file.type && !ACCEPTED_MIME_TYPES.has(file.type)) {
    return "O arquivo selecionado não parece ser uma imagem permitida.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `A imagem deve ter no máximo ${formatarTamanho(MAX_IMAGE_BYTES)}.`;
  }

  return "";
}

function getFallback(texto: string) {
  const partes = texto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return partes || "QE";
}

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function gerarImagemQuadrada(
  src: string,
  zoom: number,
  offsetX: number,
  offsetY: number
) {
  const image = await carregarImagem(src);
  const tamanho = 512;
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível preparar a imagem.");
  }

  context.clearRect(0, 0, tamanho, tamanho);

  const escalaBase = Math.max(tamanho / image.width, tamanho / image.height);
  const escala = escalaBase * zoom;
  const largura = image.width * escala;
  const altura = image.height * escala;
  const deslocamentoX = (offsetX / 100) * (tamanho / 2);
  const deslocamentoY = (offsetY / 100) * (tamanho / 2);
  const x = (tamanho - largura) / 2 + deslocamentoX;
  const y = (tamanho - altura) / 2 + deslocamentoY;

  context.drawImage(image, x, y, largura, altura);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível gerar a imagem ajustada."));
          return;
        }

        resolve(
          new File([blob], `imagem-${Date.now()}.webp`, {
            type: "image/webp",
          })
        );
      },
      "image/webp",
      0.92
    );
  });
}

export function ImageCropUpload({
  id,
  label,
  imageUrl,
  fallbackText,
  helper,
  disabled = false,
  uploading = false,
  mensagem = "",
  status = "idle",
  buttonLabel = "Escolher arquivo",
  previewSizeClassName = "h-20 w-20",
  onUpload,
}: ImageCropUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [erro, setErro] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [processando, setProcessando] = useState(false);

  const mensagemClasse =
    status === "success"
      ? "text-emerald-700"
      : status === "error" || erro
        ? "text-red-700"
        : "text-gray-600";
  const previewStyle = useMemo(
    () => ({
      transform: `translate(${offsetX / 2}%, ${offsetY / 2}%) scale(${zoom})`,
    }),
    [offsetX, offsetY, zoom]
  );

  useEffect(() => {
    return () => {
      if (arquivoUrl) {
        URL.revokeObjectURL(arquivoUrl);
      }
    };
  }, [arquivoUrl]);

  function selecionarArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    const erroValidacao = validarArquivoImagem(arquivo);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    if (arquivoUrl) {
      URL.revokeObjectURL(arquivoUrl);
    }

    setErro("");
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setArquivoUrl(URL.createObjectURL(arquivo));
    setAjusteAberto(true);
  }

  async function confirmarAjuste() {
    if (!arquivoUrl) {
      return;
    }

    setProcessando(true);
    setErro("");

    try {
      const arquivoAjustado = await gerarImagemQuadrada(
        arquivoUrl,
        zoom,
        offsetX,
        offsetY
      );
      await onUpload(arquivoAjustado);
      setAjusteAberto(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível ajustar a imagem."
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          className={`flex ${previewSizeClassName} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950 text-sm font-bold text-white ring-4 ring-gray-100`}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            getFallback(fallbackText)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={IMAGE_UPLOAD_ACCEPT}
            disabled={disabled || uploading || processando}
            onChange={selecionarArquivo}
            className="sr-only"
          />
          <button
            type="button"
            disabled={disabled || uploading || processando}
            onClick={() => inputRef.current?.click()}
            className="min-h-9 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            {uploading || processando ? "Processando..." : buttonLabel}
          </button>
          <p className="mt-2 text-sm text-gray-500">{helper}</p>
          <p className={`mt-2 text-sm font-medium ${mensagemClasse}`} aria-live="polite">
            {erro || (uploading ? "Enviando imagem..." : mensagem)}
          </p>
        </div>
      </div>

      {ajusteAberto && arquivoUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-4">
          <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-950">
                  Ajustar enquadramento
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  A imagem será apresentada em formato circular 1:1.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAjusteAberto(false)}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="h-64 w-64 overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={arquivoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  style={previewStyle}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold text-gray-700">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Posição horizontal
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={offsetX}
                  onChange={(event) => setOffsetX(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Posição vertical
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={1}
                  value={offsetY}
                  onChange={(event) => setOffsetY(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAjusteAberto(false)}
                className="min-h-10 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processando || uploading}
                onClick={confirmarAjuste}
                className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                {processando || uploading ? "Aplicando..." : "Aplicar imagem"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
