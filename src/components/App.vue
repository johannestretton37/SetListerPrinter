<template>
<div id="app">
  <div v-if="setList">
    <h1>{{ setListTitle }}</h1>
    <song v-if="songs" v-for="(song, i) in songs" :song="song" :key="i" />
    <div class="button" @click="addNewSong">ADD NEW SONG</div>
    <div v-if="songs.length > 0" class="button" @click="reset">RESET ALL SONGS</div>
  </div>
  <div v-else>
    <h1>SetListPrinter 1.0</h1>
    <form @submit.prevent="createSetList">
      <label for="input">Enter new SetList title</label>
      <input
      id="input"
      type="text"
      v-model="title"
      autofocus="true"
      placeholder="title">
      <input
      type="submit"
      value="CREATE"
      class="button"
      @click="createSetList"/>
    </form>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Song from './Song.vue'
import { Actions, Mutations } from '../constants'
import SongModel from '../classes/Song'
import SetList from '../classes/SetList'
import ISongData from '../interfaces/ISongData'
import firebaseConfig from '../../config/firebase.config'
import firebase from 'firebase'
import 'firebase/firestore'

@Component({
  components: {
    Song
  }
})
export default class App extends Vue {
  private title: string = ''

  get setList(): SetList {
    return this.$store.getters.setList
  }

  get setListTitle(): string {
    return this.$store.getters.setListTitle
  }

  get songs(): SongModel[] {
    const songs = this.$store.getters.songs
    console.log('App.songs() getter invoked')
    if (songs.length === 0) {
      return []
    }
    return songs
  }

  private createSetList() {
    if (this.title !== '') {
      this.$store.dispatch(Actions.CREATE_SETLIST, this.title)
    }
  }

  private addNewSong() {
    const songName = prompt('Enter the name of the song')
    if (songName !== '') {
      this.$store.dispatch(Actions.ADD_SONG, songName)
    }
  }

  private reset() {
    const clear = confirm('This will delete all chords. Are you sure?')
    if (clear) {
      localStorage.clear()
      this.$store.dispatch(Actions.LOAD_SETLIST)
    }
  }

  private created() {
    firebase.initializeApp(firebaseConfig)
  }

  private mounted() {
    console.log('App and running \uD83D\uDE00')
    this.$store.dispatch(Actions.LOAD_SETLISTS)
  }
}
</script>

<style lang="scss">
* {
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    'Open Sans', 'Helvetica Neue', sans-serif;
}
h1 {
  text-align: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.8em;
  width: 50%;
  margin: 1.6em auto 1em;
}
form {
  display: flex;
  flex-direction: column;
  margin: 1em auto;
  max-width: 600px;
  & > * {
    display: block;
    flex-grow: 1;
    margin-bottom: 1em;
  }
  label {
    border: 1px solid #eee;
    border-radius: 5px;
    text-align: center;
    padding: 0.6em 2em;
  }
  input,
  button {
    padding: 0.6em 2em;
    font-size: 1em;
    appearance: none;
    outline: none;
  }
}
.button {
  display: block;
  cursor: pointer;
  margin: 1em auto;
  padding: 0.6em 2em;
  width: 200px;
  text-align: center;
  background-color: #555;
  color: #eee;
  border-radius: 5px;
  &:hover {
    background-color: #333;
    color: #fff;
  }
}
@media print {
  .button {
    display: none;
  }
  h4 {
    margin: 1em auto;
  }
  .song {
    -webkit-print-color-adjust: exact;
    page-break-inside: avoid;
  }
}
</style>
