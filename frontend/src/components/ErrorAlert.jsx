/**
 * Polished aerospace error state component.
 * Uses backend-provided error codes and messages.
 */
const ERROR_META = {
  LOCATION_NOT_FOUND: {
    icon: '⊙',
    title: 'Location Not Found',
    hint: 'No three-sensor observation exists near these coordinates. Try adjusting the search radius or selecting a different position.',
    color: 'border-amber-700 bg-amber-950/40 text-amber-300',
  },
  INVALID_COORDINATES: {
    icon: '⊗',
    title: 'Invalid Coordinates',
    hint: 'Latitude must be in [−90, +90] and longitude in [0, 360].',
    color: 'border-red-700 bg-red-950/40 text-red-300',
  },
  INVALID_IMAGE: {
    icon: '⊘',
    title: 'Invalid Image Format',
    hint: 'Accepted formats: PNG, JPEG, TIFF, NPY. Ensure the file is a valid sensor observation.',
    color: 'border-red-700 bg-red-950/40 text-red-300',
  },
  IMAGE_TOO_LARGE: {
    icon: '⊘',
    title: 'Image File Too Large',
    hint: 'Maximum upload size is 20 MB per image. Resize or downsample before uploading.',
    color: 'border-red-700 bg-red-950/40 text-red-300',
  },
  MODEL_NOT_READY: {
    icon: '◌',
    title: 'Model Not Ready',
    hint: 'The LoFTR inference model has not finished loading. Please wait a moment and try again.',
    color: 'border-amber-700 bg-amber-950/40 text-amber-300',
  },
  BACKEND_UNAVAILABLE: {
    icon: '⊖',
    title: 'Backend Unavailable',
    hint: 'Could not connect to the inference server. Ensure the backend is running on the configured port.',
    color: 'border-slate-700 bg-slate-900/60 text-slate-400',
  },
  PROCESSING_FAILED: {
    icon: '⊗',
    title: 'Processing Failed',
    hint: 'The pipeline encountered an unexpected error. Check server logs for details.',
    color: 'border-red-700 bg-red-950/40 text-red-300',
  },
  INSUFFICIENT_EVIDENCE: {
    icon: '◎',
    title: 'Insufficient Evidence',
    hint: 'The system could not gather enough correspondence evidence to make a reliable decision.',
    color: 'border-amber-700 bg-amber-950/40 text-amber-300',
  },
}

function detectCode(message) {
  if (!message) return null
  const up = message.toUpperCase()
  for (const code of Object.keys(ERROR_META)) {
    if (up.includes(code)) return code
  }
  if (up.includes('ECONNREFUSED') || up.includes('FETCH') || up.includes('NETWORKERROR')) {
    return 'BACKEND_UNAVAILABLE'
  }
  return null
}

export default function ErrorAlert({ error, onDismiss }) {
  if (!error) return null

  const code = detectCode(error)
  const meta = ERROR_META[code] || {
    icon: '⊗',
    title: 'Error',
    hint: null,
    color: 'border-red-700 bg-red-950/40 text-red-300',
  }

  return (
    <div className={`border px-4 py-3 font-mono text-sm fade-in-up ${meta.color}`} role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0 mt-0.5">{meta.icon}</span>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider mb-1">{meta.title}</div>
            {meta.hint && <p className="text-[11px] opacity-80 mb-1">{meta.hint}</p>}
            {code && <div className="text-[10px] opacity-50 uppercase tracking-widest">Code: {code}</div>}
            <div className="text-[10px] opacity-60 mt-1 break-all">{error}</div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-xs opacity-50 hover:opacity-100 transition-opacity mt-0.5"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
