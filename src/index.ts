import Vue from 'vue'
import store from './stores/Store'
import Component from 'vue-class-component'
import App from './components/App.vue'
import * as firebase from 'firebase'
import config from '../config/firebase.config'

firebase.initializeApp(config)
const vm = new Vue({
  el: '#app',
  template: '<App/>',
  components: {
    App
  },
  store
})
