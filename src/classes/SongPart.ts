import uuid from 'uuid/v4'
import Chord from './Chord'

export default class SongPart {
  public name: string = ''
  public chords: Chord[][] = [[]]
  public id: string = uuid()
}
