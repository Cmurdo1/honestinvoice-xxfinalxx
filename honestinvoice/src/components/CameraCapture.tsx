import { useState, useRef, useEffect } from 'react'
import { Camera, X, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface CameraCaptureProps {
  onCapture: (file: File) => void
  onClose: () => void
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturing, setCapturing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false
      })
      
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Camera access denied:', error)
      toast.error('Camera access denied. Please enable camera permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(video, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `invoice-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          })
          onCapture(file)
          stopCamera()
          onClose()
        }
        setCapturing(false)
      }, 'image/jpeg', 0.9)
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <h3 className="text-white font-semibold">Capture Photo</h3>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-300 p-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative">
        {!stream ? (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={startCamera}
              className="bg-primary hover:bg-primary-600 text-white font-semibold py-4 px-8 rounded-lg flex items-center space-x-2"
            >
              <Camera className="w-6 h-6" />
              <span>Start Camera</span>
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      {stream && (
        <div className="p-6 bg-black bg-opacity-50 flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={capturing}
            className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 border-4 border-gray-300 disabled:opacity-50 transition-all haptic-feedback"
            style={{ boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.3)' }}
          >
            {capturing ? (
              <div className="w-full h-full rounded-full bg-primary animate-pulse" />
            ) : (
              <div className="w-full h-full rounded-full bg-white" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

// Hook to check camera availability
export function useCameraSupport() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    const checkSupport = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasCamera = devices.some(device => device.kind === 'videoinput')
          setIsSupported(hasCamera)
        } catch (error) {
          setIsSupported(false)
        }
      }
    }

    checkSupport()
  }, [])

  return isSupported
}
