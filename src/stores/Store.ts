import Vue from 'vue'
import Vuex, { MutationTree, GetterTree, ActionTree } from 'vuex'
import Song from '../classes/Song'
import SetList from '../classes/SetList'
import { Mutations, Actions, Note, MusicSymbols } from '../constants'
import SongPart from '../classes/SongPart'
import ISongData from '../interfaces/ISongData'
// import mockSetList from '../../__MOCKS/data'
import FirestoreDatabaseConnection from '../db'
import User from '../classes/User'

Vue.use(Vuex)

export interface IState {
  user?: User
  setList?: SetList
  setLists?: SetList[]
  editModeId: string
  // currSong?: Song
  currPartId: string
}

const initialState: IState = {
  user: undefined,
  editModeId: '',
  // currSong: undefined,
  currPartId: ''
}

const mutations: MutationTree<IState> = {
  [Mutations.UPDATE_USER]: (state, user) => {
    state.user = user
  },
  [Mutations.LOAD_SETLISTS]: (state, setLists) => {
    state.setLists = setLists
  },
  [Mutations.OPEN_SETLIST]: (state, setList) => {
    Vue.set(state, 'setList', setList)
    db.watchSetList(setList)
  },
  [Mutations.INIT_SONGS]: (state, songs) => {
    Vue.set(state, 'songs', songs)
  },
  [Mutations.EDIT_MODE]: (state, editModeId) => {
    state.editModeId = editModeId
    if (editModeId === undefined) {
      // state.currSong = undefined
      state.currPartId = ''
    } else {
      const currSong = state.setList!.songs.find(song => song.id === editModeId)
      if (
        currSong &&
        currSong.notes &&
        currSong.notes.arrangement &&
        currSong.notes.arrangement.parts
      ) {
        const lastPart = currSong.notes.arrangement.parts.length - 1
        state.currPartId = currSong.notes.arrangement.parts[lastPart].id
      }
    }
  },
  [Mutations.ADD_SONG]: (state, newSong: Song) => {
    if (!state.setList) {
      throw new Error('No SetList defined')
    }
    const index = state.setList.songs.length
    Vue.set(state.setList.songs, index, newSong)
  },
  [Mutations.EDIT_SONG]: (state, editedSong: Song) => {
    if (!state.setList) {
      throw new Error('No SetList defined')
    }
    const index = state.setList.songs.findIndex(song => song.id === editedSong.id)
    if (index === -1) {
      throw new Error('Found no song to edit')
    }
    Vue.set(state.setList.songs, index, editedSong)
  },
  [Mutations.DELETE_SONG]: (state, editedSong: Song) => {
    if (!state.setList) {
      throw new Error('No SetList defined')
    }
    const index = state.setList.songs.findIndex(song => song.id === editedSong.id)
    if (index === -1) {
      throw new Error('Found no song to delete')
    }
    state.setList.songs.splice(index, 1)
  },
  [Mutations.UPDATE_CURRENT_SONG]: (state, song) => {
    // Vue.set(state, 'currSong', song)
    // if (song.notes && song.notes.arrangement) {
    //   const parts = song.notes.arrangement.parts
    //   state.currPartId = parts[parts.length - 1].id
    // }
  },
  [Mutations.UPDATE_CURRENT_PART_ID]: (state, currentPartId) => {
    // if (state.currSong!.notes && state.currSong!.notes!.arrangement) {
    //   const parts = state.currSong!.notes!.arrangement.parts
    state.currPartId = currentPartId // parts[parts.length - 1].id
    // }
  },
  [Mutations.RESET_SONG]: (state, song) => {
    state.editModeId = ''
    // state.currSong = undefined
    const index = state.setList!.songs.findIndex(storedSong => storedSong.id === song.id)
    Vue.set(state.setList!.songs, index, song)
  },
  [Mutations.EDIT_SONG_KEY]: (state, { newKey, id }) => {
    const index = state.setList!.songs.findIndex(storedSong => storedSong.id === id)
    const song = state.setList!.songs[index]
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
        Vue.set(state.setList!.songs[index].notes!.arrangement, 'originalKey', newKeyCapitalized)
      }
    } else {
      throw new Error('Song has no notes:' + song.name)
    }
  }
}

const actions: ActionTree<IState, any> = {
  [Actions.CREATE_SETLIST]: ({ state, commit }, title: string) => {
    const newSetList = new SetList(title)
    // TODO: Persist to backend
    commit(Mutations.OPEN_SETLIST, newSetList)
  },
  /**
   * Load setlists from firebase into vuex state
   * Open user's last opened setList
   */
  [Actions.LOAD_SETLISTS]: async ({ state, commit }) => {
    try {
      const user = new User({
        uid: 'MockUserId',
        name: 'Johannes Borgström',
        avatar: '',
        email: 'johannes@highspirits.se',
        currentSetList: ''
      })
      commit(Mutations.UPDATE_USER, user)
      if (!state.user) {
        throw new Error('No User')
      }
      const setLists = await db.getSetLists(state.user.uid)
      if (Object.keys(setLists).length > 0) {
        commit(Mutations.LOAD_SETLISTS, setLists)
        const setListId = await db.getUsersLastSetListId(state.user)
        const setList = setLists[setListId]
        commit(Mutations.OPEN_SETLIST, setList)
      } else {
        console.log('No setLists exists, create new')
        debugger
      }
    } catch (error) {
      console.log('Error in Actions.LOAD_SETLISTS', error)
    }
  },
  [Actions.LOAD_SETLIST]: ({ state, commit }) => {
    // let setList: SetList | undefined
    // if (!setList) {
    //   const storageName = localStorage.getItem('setListName')
    //   if (storageName) {
    //     setList = new SetList(storageName)
    //     const storage = localStorage.getItem('songs')
    //     if (storage) {
    //       const storedSongs = JSON.parse(storage)
    //       storedSongs.forEach((storedSong: ISongData) => {
    //         const song = Song.deserialize(storedSong)
    //         if (song) {
    //           setList!.songs.push(song)
    //         }
    //       })
    //     }
    //   }
    // }
    // if (setList) {
    //   commit(Mutations.OPEN_SETLIST, setList)
    //   commit(Mutations.INIT_SONGS, setList.songs)
    // }
  },
  [Actions.ADD_SONG]: async ({ state, commit, dispatch }, songName) => {
    console.log('Actions.ADD_SONG')
    const newSong = new Song(songName)
    const addedSong = await db.addSong(newSong, state.setList!.id)
    console.log('Added song with id', addedSong.id)
    // commit(Mutations.ADD_SONG, newSong)
    // dispatch(Actions.SAVE_EDITS)
  },
  [Actions.EDIT_SONG]: async ({ state, commit }, song) => {
    await db.editSong(song, state.setList!.id)
    console.log('editedSong:')
  },
  [Actions.SAVE_EDITS]: ({ state, commit }) => {
    const json = JSON.stringify(
      state.setList!.songs.map(song => {
        const { id, notes, name } = song
        return { id, notes, name }
      })
    )
    localStorage.setItem('setListName', state.setList!.title)
    localStorage.setItem('songs', json)
  }
}

const getters: GetterTree<IState, any> = {
  setList: state => {
    return state.setList
  },
  setListTitle: state => {
    if (state.setList) {
      return state.setList.title || 'Untitled'
    }
    return ''
  },
  editModeId: state => {
    return state.editModeId
  },
  // currSong: state => {
  //   return state.currSong
  // },
  currKey: state => {
    if (state.setList === undefined) {
      return ''
    }
    const editSong = state.setList!.songs.find(song => song.id === state.editModeId)
    if (editSong && editSong.notes && editSong.notes.arrangement) {
      return editSong.notes.arrangement.key()
    }
  },
  currPartId: state => {
    return state.currPartId
  },
  // currSongParts: state => {
  //   if (state.currSong && state.currSong.notes && state.currSong.notes.arrangement) {
  //     return state.currSong.notes.arrangement.parts
  //   } else {
  //     return undefined
  //   }
  // },
  songs: state => {
    if (!state.setList) {
      return []
    }
    return state.setList.songs
  }
}

const store = new Vuex.Store<IState>({
  state: initialState,
  mutations,
  actions,
  getters
})

// Init database connection
const db: FirestoreDatabaseConnection = new FirestoreDatabaseConnection(store)

export default store
