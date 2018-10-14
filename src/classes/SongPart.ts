import uuid from 'uuid/v4'
import Chord from './Chord'
import IChordData from '../interfaces/IChordData'

export default class SongPart {
  public name: string = ''
  public id: string = uuid()
  public chords?: Chord[][] // = [[]]

  public serialize() {
    const chords: { [key: string]: IChordData[] } = {}
    let i = 0
    if (this.chords) {
      this.chords.forEach(chordLine => {
        const line: IChordData[] = []
        chordLine.forEach(chord => {
          line.push(chord.serialize())
        })
        if (line.length > 0) {
          chords[`${i++}`] = line
        }
      })
      return {
        id: this.id,
        name: this.name,
        chords
      }
    } else {
      return {
        id: this.id,
        name: this.name
      }
    }
  }
}
