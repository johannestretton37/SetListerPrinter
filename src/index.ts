import Vue from 'vue'
import store from './stores/Store'
import Component from 'vue-class-component'
import App from './components/App.vue'

const vm = new Vue({
  el: '#app',
  template: '<App/>',
  components: {
    App
  },
  store
})
