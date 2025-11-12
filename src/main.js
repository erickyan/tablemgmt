import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'
import orderdetails from './components/OrderDetails.vue'
import togodetails from './components/TogoDetails.vue'
import currenttogo from './components/CurrentTogo.vue'


import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    components,
    directives,
  })

const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(store)
app.component('order-details', orderdetails)
app.component('togo-details', togodetails)
app.component('currenttogo-details', currenttogo)

app.mount('#app')

// Make store accessible from browser console for debugging
if (import.meta.env.DEV) {
  window.store = store
}

// Initialize authentication (which will in turn bootstrap Firestore listeners)
store.dispatch('initializeAuth').catch(err => {
  console.error('Failed to initialize Firebase Auth:', err)
})