<template>
<div id="app">
  <div v-if="project">
    <h1>{{ projectName }}</h1>
    <song v-if="songs" v-for="(song, i) in songs" :song="song" :key="i" />
    <div v-if="songs" class="button" @click="reset">RESET</div>
  </div>
  <div v-else>
    <h1>SetListPrinter 1.0</h1>
    <label for="input">Enter SetList title</label>
    <input
    id="input"
    type="text"
    v-model="title"
    placeholder="Title">
    <div
    class="button"
    @click="createProject">CREATE</div>
  </div>

</div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import Song from './Song.vue'
import { Actions, Mutations } from '../constants'
import SongModel from '../classes/Song'
import Project from '../classes/Project'
import ISongData from '../interfaces/ISongData'

@Component({
  components: {
    Song
  }
})
export default class App extends Vue {
  private title: string = ''

  get project(): Project {
    return this.$store.getters.project
  }

  get projectName(): string {
    return this.$store.getters.projectName
  }

  get songs(): SongModel[] {
    const songs = this.$store.getters.songs
    if (songs.length === 0) {
      return []
    }
    return songs
  }

  private createProject() {
    if (this.title !== '') {
      this.$store.dispatch(Actions.CREATE_PROJECT, this.title)
    }
  }

  private reset() {
    const clear = confirm('This will delete all chords. Are you sure?')
    if (clear) {
      localStorage.clear()
      this.$store.dispatch(Actions.LOAD_PROJECT)
    }
  }

  private mounted() {
    console.log('App and running \uD83D\uDE00')
    this.$store.dispatch(Actions.LOAD_PROJECT)
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
