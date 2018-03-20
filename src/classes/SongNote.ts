import SongArrangement from './SongArrangement'

export default class SongNote {
  constructor(public arrangement: SongArrangement) {
    console.log(this)
  }
  public serialize = () => {
    return {
      arrangement: this.arrangement.serialize()
    }
  }
}
