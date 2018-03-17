import Song from './Song'
import uuid from 'uuid/v4'

export default class Project {
  public id: string
  public songs: Song[] = []
  public users: { [key: string]: boolean } = {}
  constructor(public title: string, id?: string) {
    this.id = id || uuid()
  }
}
