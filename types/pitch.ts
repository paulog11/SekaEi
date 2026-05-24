export interface PitchSample {
  t: number
  hz: number
}

export interface PitchSeries {
  samples: PitchSample[]
  durationSec: number
  medianHz: number
}
