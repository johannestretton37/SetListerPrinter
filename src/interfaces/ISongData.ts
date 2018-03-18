import Chord from '../classes/Chord'
import IChordData from '../interfaces/IChordData'

export default interface ISongData {
  id?: string
  name: string
  notes?: {
    arrangement?: {
      originalKey: string
      preferredSign: string
      transpose: number
      isMinor: boolean
      parts: Array<{
        name?: string
        chords?: { [key: string]: IChordData[] }
      }>
    }
  }
}
