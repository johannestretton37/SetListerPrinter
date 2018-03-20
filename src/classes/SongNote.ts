import SongArrangement from './SongArrangement'

export default class SongNote {
  constructor(public arrangement: SongArrangement) {}
  public serialize = () => {
    return {
      arrangement: this.arrangement.serialize()
    }
  }
}
