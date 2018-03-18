import SongPart from './SongPart'
import Chord from './Chord'
import { Note, MusicSymbols } from '../constants'

export default class SongArrangement {
  public parts: SongPart[] = []
  public originalKey: string = MusicSymbols.gClef
  public preferredSign: string = MusicSymbols.natural
  public isMinor: boolean = false
  public transpose: number = 0

  public key(): string {
    if (this.originalKey === MusicSymbols.gClef) {
      return MusicSymbols.gClef
    }
    const chord = Chord.parse(this.originalKey)
    const key = chord.chordFromInt(chord.rootInt, this)
    return `${key}${this.isMinor ? 'm' : ''}`
  }

  public serialize = () => {
    const parts = this.parts.map(part => {
      return part.serialize()
    })
    return {
      parts,
      originalKey: this.originalKey,
      preferredSign: this.preferredSign,
      isMinor: this.isMinor,
      transpose: this.transpose
    }
  }
}
