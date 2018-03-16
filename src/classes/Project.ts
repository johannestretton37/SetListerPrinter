import Song from './Song'

export default class Project {
  public songs: Song[] = []
  constructor(public name: string) {}
}
