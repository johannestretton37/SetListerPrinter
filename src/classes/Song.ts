import SongNote from './SongNote'
import SongArrangement from './SongArrangement'
import ISongData from '../interfaces/ISongData'
import SongPart from './SongPart'
import uuid from 'uuid/v4'
import Chord from './Chord'

export default class Song {
  public static deserialize(data: ISongData): Song | undefined {
    if (data.name) {
      const song = new Song(data.name, data.id)
      if (data.notes && data.notes.arrangement) {
        const arrangement = new SongArrangement()
        Object.assign(arrangement, data.notes.arrangement)
        if (data.notes.arrangement.parts) {
          arrangement.parts = []
          data.notes.arrangement.parts.forEach(part => {
            const songPart = new SongPart()
            songPart.name = part.name || ''
            if (part.chords === undefined) {
              part.chords = []
            }
            const chordLines: Chord[][] = []
            part.chords.forEach(storedChordLine => {
              const chordLine: Chord[] = []
              storedChordLine.forEach(chordData => {
                const chord = Chord.chordFromData(chordData)
                chordLine.push(chord)
              })
              chordLines.push(chordLine)
            })
            songPart.chords = chordLines
            arrangement.parts.push(songPart)
          })
        }
        song.notes = new SongNote(arrangement)
      }
      return song
    }
  }
  public id: string
  public notes?: SongNote
  constructor(public name: string, id?: string) {
    this.id = id || uuid()
  }
}
