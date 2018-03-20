import uuid from 'uuid/v4'
import Chord from './Chord'
import IChordData from '../interfaces/IChordData'

export default class SongPart {
  public name: string = ''
  public chords: Chord[][] = [[]]
  public id: string = uuid()

  public serialize() {
    const chords: { [key: string]: IChordData[] } = {}
    let i = 0
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
      name: this.name,
      chords
    }
  }
}
