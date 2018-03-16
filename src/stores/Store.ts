import Vue from 'vue'
import Vuex, { MutationTree, GetterTree, ActionTree } from 'vuex'
import Song from '../classes/Song'
import Project from '../classes/Project'
import { Mutations, Actions, Note, MusicSymbols } from '../constants'
import SongPart from '../classes/SongPart'
import ISongData from '../interfaces/ISongData'
import mockProject from '../../__MOCKS/data'

Vue.use(Vuex)

export interface IState {
  project?: Project
  songs: Song[]
  editModeId: string
  currSong?: Song
  currPartId: string
}

const initialState: IState = {
  songs: [],
  editModeId: '',
  currSong: undefined,
  currPartId: ''
}

const mutations: MutationTree<IState> = {
  [Mutations.OPEN_PROJECT]: (state, project) => {
    Vue.set(state, 'project', project)
  },
  [Mutations.INIT_SONGS]: (state, songs) => {
    Vue.set(state, 'songs', songs)
  },
  [Mutations.EDIT_MODE]: (state, editModeId) => {
    state.editModeId = editModeId
    if (editModeId === undefined) {
      state.currSong = undefined
      state.currPartId = ''
    }
  },
  [Mutations.ADD_NEW_SONG]: (state, newSong: Song) => {
    state.songs.push(newSong)
  },
  [Mutations.UPDATE_CURRENT_SONG]: (state, song) => {
    Vue.set(state, 'currSong', song)
    if (song.notes && song.notes.arrangement) {
      const parts = song.notes.arrangement.parts
      state.currPartId = parts[parts.length - 1].id
    }
  },
  [Mutations.UPDATE_CURRENT_PART_ID]: state => {
    if (state.currSong!.notes && state.currSong!.notes!.arrangement) {
      const parts = state.currSong!.notes!.arrangement.parts
      state.currPartId = parts[parts.length - 1].id
    }
  },
  [Mutations.RESET_SONG]: (state, song) => {
    state.editModeId = ''
    state.currSong = undefined
    const index = state.songs.findIndex(storedSong => storedSong.id === song.id)
    Vue.set(state.songs, index, song)
  },
  [Mutations.EDIT_SONG_KEY]: (state, { newKey, id }) => {
    const index = state.songs.findIndex(storedSong => storedSong.id === id)
    const song = state.songs[index]
    // state.currSong = song
    state.editModeId = id
    if (song.notes && song.notes.arrangement) {
      const notes = song.notes
      const arrangement = notes.arrangement
      // If user types 'D#', we should not set key to 'Eb'
      let preferredSign = MusicSymbols.natural
      if (newKey.length > 1 && newKey.endsWith('b')) {
        preferredSign = MusicSymbols.flat
      } else if (newKey.endsWith('#')) {
        preferredSign = MusicSymbols.sharp
      }
      Vue.set(arrangement, 'preferredSign', preferredSign)

      const newKeyCapitalized = newKey.substr(0, 1).toUpperCase() + newKey.substr(1)
      if (arrangement.originalKey && arrangement.originalKey !== MusicSymbols.gClef) {
        // This an update, transpose!
        console.log('Edit song key from', arrangement.originalKey, 'to', newKey)
        const originalKeyInt = Note[arrangement.originalKey]
        const newKeyInt = Note[newKeyCapitalized.replace('m', '')]
        const transpose = newKeyInt - originalKeyInt
        console.log(originalKeyInt, '=>', newKeyInt, 'transpose =', transpose)
        Vue.set(arrangement, 'transpose', transpose)
        if (newKey.substr(-1, 1) === 'm') {
          Vue.set(arrangement, 'isMinor', true)
        } else {
          Vue.set(arrangement, 'isMinor', false)
        }
      } else {
        // Set initial originalKey value
        console.log('Set initial originalKey value', song)
        // arrangement.originalKey = newKey.toUpperCase()
        Vue.set(state.songs[index].notes!.arrangement, 'originalKey', newKeyCapitalized)
      }
    } else {
      throw new Error('Song has no notes:' + song.name)
    }
  }
}

const actions: ActionTree<IState, any> = {
  [Actions.CREATE_PROJECT]: ({ state, commit }, title: string) => {
    const newProject = new Project(title)
    // TODO: Persist to backend
    commit(Mutations.OPEN_PROJECT, newProject)
  },
  [Actions.LOAD_PROJECT]: ({ state, commit }) => {
    // TODO: Fetch from backend
    let project: Project | undefined
    if (process.env.NODE_ENV === 'development') {
      project = mockProject
    }
    if (!project) {
      const storageName = localStorage.getItem('projectName')
      if (storageName) {
        project = new Project(storageName)
        const storage = localStorage.getItem('songs')
        if (storage) {
          const storedSongs = JSON.parse(storage)
          storedSongs.forEach((storedSong: ISongData) => {
            const song = Song.deserialize(storedSong)
            if (song) {
              project!.songs.push(song)
            }
          })
        }
      }
    }
    if (project) {
      commit(Mutations.OPEN_PROJECT, project)
      commit(Mutations.INIT_SONGS, project.songs)
    }
  },
  [Actions.ADD_NEW_SONG]: ({ state, commit, dispatch }, songName) => {
    const newSong = new Song(songName)
    commit(Mutations.ADD_NEW_SONG, newSong)
    dispatch(Actions.SAVE_EDITS)
  },
  [Actions.SAVE_EDITS]: ({ state, commit }) => {
    const json = JSON.stringify(
      state.songs.map(song => {
        const { id, notes, name } = song
        return { id, notes, name }
      })
    )
    localStorage.setItem('projectName', state.project!.name)
    localStorage.setItem('songs', json)
  }
}

const getters: GetterTree<IState, any> = {
  project: state => {
    return state.project
  },
  projectName: state => {
    if (state.project) {
      return state.project.name || 'Untitled'
    }
    return ''
  },
  editModeId: state => {
    return state.editModeId
  },
  currSong: state => {
    return state.currSong
  },
  currKey: state => {
    const editSong = state.songs.find(song => song.id === state.editModeId)
    if (editSong && editSong.notes && editSong.notes.arrangement) {
      return editSong.notes.arrangement.key()
    }
  },
  // currPart: state => {
  //   return state.currSong
  // },
  currSongParts: state => {
    if (state.currSong && state.currSong.notes && state.currSong.notes.arrangement) {
      return state.currSong.notes.arrangement.parts
    } else {
      return undefined
    }
  },
  songs: state => {
    return state.songs
  }
}

const store = new Vuex.Store<IState>({
  state: initialState,
  mutations,
  actions,
  getters
})

export default store
