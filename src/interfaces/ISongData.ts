import Chord from '../classes/Chord'
import IChordData from '../interfaces/IChordData'

export default interface ISongData {
  id?: string
  index: number
  name: string
  notes?: {
    arrangement?: {
      originalKey: string
      preferredSign: string
      transpose: number
      isMinor: boolean
      parts: Array<{
        name?: string
        id?: string
        chords?: { [key: string]: IChordData[] }
      }>
    }
  }
}
