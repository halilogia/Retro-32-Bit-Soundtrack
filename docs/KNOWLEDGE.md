# 🧠 Knowledge Base - Retro 32-Bit Soundtrack Generator

## 🎵 Musical Scales & Math
- **Equal Temperament Note Formula**:
  $$f = 440 \times 2^{(n - 69) / 12}$$
- **Genre BPM Profiles**:
  - **Arcade**: 140 BPM, Major / Pentatonic, fast 16th-note arpeggiator.
  - **Lo-Fi**: 85 BPM, Minor 7th chords, relaxed swing timing, triangle wave.
  - **Dark**: 110 BPM, Phrygian mode, heavy sub-bass with lowpass cutoff filter.
  - **Glitch**: 160 BPM, Random step intervals, noise bursts, bitcrush simulation.

## 🥁 Drum Synthesis Formulas
- **Kick**: Sine wave starting at 150 Hz sweeping rapidly to 30 Hz in 80ms via `exponentialRampToValueAtTime`.
- **Snare**: White noise buffer passed through a high-pass filter mixed with an 80 Hz sine pop.
- **Hi-Hat**: Short burst of white noise with tight envelope (15ms decay).
