/** Procedural soft jazz-lofi pad when no MP3 is available. */

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 349.23], // G7
]

export class LofiAmbientSynth {
  private ctx: AudioContext | null = null
  private chordIndex = 0
  private chordTimer: number | null = null
  private oscillators: OscillatorNode[] = []
  private vinylNode: AudioBufferSourceNode | null = null

  async start() {
    if (this.ctx) return

    const ctx = new AudioContext()
    this.ctx = ctx

    const master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1200
    filter.Q.value = 0.6
    filter.connect(master)

    const vinyl = ctx.createBufferSource()
    vinyl.buffer = this.createVinylNoise(ctx)
    vinyl.loop = true
    const vinylGain = ctx.createGain()
    vinylGain.gain.value = 0.04
    vinyl.connect(vinylGain)
    vinylGain.connect(filter)
    vinyl.start()
    this.vinylNode = vinyl

    this.playChord(filter)
    this.chordTimer = window.setInterval(() => {
      this.stopOscillators()
      this.chordIndex = (this.chordIndex + 1) % CHORDS.length
      this.playChord(filter)
    }, 5200)

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
  }

  stop() {
    if (this.chordTimer) {
      clearInterval(this.chordTimer)
      this.chordTimer = null
    }
    this.stopOscillators()
    try {
      this.vinylNode?.stop()
    } catch {
      /* already stopped */
    }
    this.vinylNode = null
    void this.ctx?.close()
    this.ctx = null
  }

  private playChord(destination: AudioNode) {
    const ctx = this.ctx
    if (!ctx) return

    const freqs = CHORDS[this.chordIndex]
    for (const freq of freqs) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.8)
      gain.gain.setValueAtTime(0.05, ctx.currentTime + 4.5)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.2)

      osc.connect(gain)
      gain.connect(destination)
      osc.start()
      osc.stop(ctx.currentTime + 5.3)
      this.oscillators.push(osc)
    }
  }

  private stopOscillators() {
    for (const osc of this.oscillators) {
      try {
        osc.stop()
      } catch {
        /* ignore */
      }
    }
    this.oscillators = []
  }

  private createVinylNoise(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35
    }
    return buffer
  }
}
