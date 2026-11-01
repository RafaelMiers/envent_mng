import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'

interface QrCodeScannerProps {
  onDetected: (value: string) => void
  onClose: () => void
}

function getCameraError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Acesso à câmera negado. Permita o uso da câmera no navegador e tente novamente.'
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'Nenhuma câmera foi encontrada neste dispositivo.'
  }
  if (error instanceof Error) {
    return `Não foi possível iniciar a câmera: ${error.message}`
  }
  return 'Não foi possível iniciar a câmera.'
}

export function QrCodeScanner({ onDetected, onClose }: QrCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUseCamera =
    window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia)
  const [errorMessage, setErrorMessage] = useState(() =>
    canUseCamera
      ? ''
      : 'A câmera ao vivo exige HTTPS ou acesso pelo endereço localhost. Você ainda pode tirar uma foto do QR code ou selecionar uma imagem abaixo.',
  )

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0]
    event.target.value = ''
    if (!image) {
      return
    }

    const imageUrl = URL.createObjectURL(image)
    try {
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(imageUrl)
      onDetectedRef.current(result.getText())
    } catch {
      setErrorMessage(
        'Não foi possível encontrar um QR code legível nessa imagem. Tente outra foto.',
      )
    } finally {
      URL.revokeObjectURL(imageUrl)
    }
  }

  useEffect(() => {
    let isActive = true
    let controls: IScannerControls | undefined

    if (!canUseCamera) {
      return () => {
        isActive = false
      }
    }

    const reader = new BrowserQRCodeReader()
    reader
      .decodeFromConstraints(
        {
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        },
        videoRef.current ?? undefined,
        (result, _error, scannerControls) => {
          controls = scannerControls
          if (!isActive || !result) {
            return
          }
          isActive = false
          scannerControls.stop()
          onDetectedRef.current(result.getText())
        },
      )
      .then((scannerControls) => {
        controls = scannerControls
        if (!isActive) {
          scannerControls.stop()
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setErrorMessage(getCameraError(error))
        }
      })

    return () => {
      isActive = false
      controls?.stop()
    }
  }, [canUseCamera])

  return (
    <div className="rounded-2xl border border-violet-300/15 bg-[#130e1d]/80 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Leitor de QR code</h3>
          <p className="mt-1 text-xs text-violet-100/45">
            Aponte a câmera para o QR code do ingresso.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-10 rounded-lg border border-white/10 px-3 text-xs font-medium text-violet-100/70 hover:bg-white/[0.05]"
        >
          Fechar câmera
        </button>
      </div>

      {errorMessage ? (
        <p
          className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-3 text-sm leading-relaxed text-amber-100/80"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : canUseCamera ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="Visualização da câmera para ler o QR code"
          className="aspect-video max-h-96 w-full rounded-xl bg-black object-cover"
        />
      ) : null}
      <div className="mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => void handleImageSelected(event)}
          className="sr-only"
          aria-label="Selecionar uma imagem do QR code"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="min-h-10 rounded-lg border border-violet-300/20 px-3 text-xs font-medium text-violet-200 hover:bg-violet-400/[0.08]"
        >
          Tirar foto ou selecionar imagem do QR code
        </button>
      </div>
    </div>
  )
}
