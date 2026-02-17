const CLICK_SOUND_KEY = "breaking-eternity-click-sound"
const CLICK_SOUND_VOLUME_KEY = "breaking-eternity-click-sound-volume"

/** Volume de 0 a 100. Default 100. */
const DEFAULT_VOLUME = 100

let audioContext: AudioContext | null = null

export function getClickSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(CLICK_SOUND_KEY)
    if (v === null) return true
    return v === "1"
  } catch {
    return true
  }
}

export function setClickSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(CLICK_SOUND_KEY, enabled ? "1" : "0")
  } catch {
    // ignore
  }
}

/** Retorna o volume do som de clique (0–100). */
export function getClickSoundVolume(): number {
  try {
    const v = localStorage.getItem(CLICK_SOUND_VOLUME_KEY)
    if (v === null) return DEFAULT_VOLUME
    const n = Number(v)
    if (!Number.isFinite(n)) return DEFAULT_VOLUME
    return Math.max(0, Math.min(100, Math.round(n)))
  } catch {
    return DEFAULT_VOLUME
  }
}

/** Define o volume do som de clique (0–100). */
export function setClickSoundVolume(volume: number): void {
  try {
    const v = Math.max(0, Math.min(100, Math.round(volume)))
    localStorage.setItem(CLICK_SOUND_VOLUME_KEY, String(v))
  } catch {
    // ignore
  }
}

/** Gera um buffer de ruído branco (para som tipo hat). */
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.ceil(sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }
  return buffer
}

/** Multiplicador de ganho a partir do volume 0–100 (curva suave). */
function volumeToGain(volumePercent: number): number {
  if (volumePercent <= 0) return 0
  if (volumePercent >= 100) return 1
  return Math.pow(volumePercent / 100, 0.7)
}

/** Toca um som seco tipo hat (só ruído, decay bem curto). Respeita preferências em localStorage. */
export function playClickSound(): void {
  if (!getClickSoundEnabled()) return
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    const t0 = audioContext.currentTime
    const duration = 0.035
    const volumeMult = volumeToGain(getClickSoundVolume())

    const noise = audioContext.createBufferSource()
    noise.buffer = createNoiseBuffer(audioContext, duration)
    noise.loop = false
    const gain = audioContext.createGain()
    gain.gain.setValueAtTime(0.28 * volumeMult, t0)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
    noise.connect(gain)
    gain.connect(audioContext.destination)
    noise.start(t0)
    noise.stop(t0 + duration)
  } catch {
    // ignore (e.g. autoplay policy)
  }
}

/** Toca um som de conquista desbloqueada (dois tons curtos, tipo “ding”). Respeita som de clique ativado e volume. */
export function playAchievementSound(): void {
  if (!getClickSoundEnabled()) return
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (audioContext.state === "suspended") {
      audioContext.resume()
    }
    const t0 = audioContext.currentTime
    const volumeMult = volumeToGain(getClickSoundVolume())
    const gainNode = audioContext.createGain()
    gainNode.gain.setValueAtTime(0, t0)
    gainNode.gain.linearRampToValueAtTime(0.22 * volumeMult, t0 + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25)
    gainNode.connect(audioContext.destination)

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = audioContext!.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, t0 + start)
      osc.connect(gainNode)
      osc.start(t0 + start)
      osc.stop(t0 + start + duration)
    }
    playTone(523.25, 0, 0.12)
    playTone(659.25, 0.08, 0.14)
  } catch {
    // ignore (e.g. autoplay policy)
  }
}
