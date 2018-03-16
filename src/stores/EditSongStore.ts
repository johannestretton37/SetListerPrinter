import Song from '../classes/Song'

export interface IState {
  currSong?: Song
}

const state: IState = {
  currSong: undefined
}

const editSongStore = {
  state,
  mutations: {},
  actions: {},
  getters: {}
}

export default editSongStore
