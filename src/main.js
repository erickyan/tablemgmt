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
    theme: {
      defaultTheme: 'lunchTheme',
      themes: {
        lunchTheme: {
          dark: false,
          colors: {
            background: '#FDF6EA',
            surface: '#FFFFFF',
            primary: '#C62828',
            'primary-soft': '#F8D7C5',
            accent: '#00897B',
            toolbar: '#FFE4CC',
            drawer: '#FFF9F0',
            info: '#1E88E5',
            success: '#2E7D32',
            warning: '#FB8C00',
            error: '#D84315'
          }
        },
        dinnerTheme: {
          dark: false,
          colors: {
            background: '#FDF6EA',
            surface: '#FFFFFF',
            primary: '#C62828',
            'primary-soft': '#F8D7C5',
            accent: '#00897B',
            toolbar: '#FFE4CC',
            drawer: '#FFF9F0',
            info: '#1E88E5',
            success: '#2E7D32',
            warning: '#FB8C00',
            error: '#D84315'
          }
        }
      }
    }
  })

async function bootstrap() {
  const app = createApp(App)

  app.use(router)
  app.use(vuetify)
  app.use(store)
  app.component('order-details', orderdetails)
  app.component('togo-details', togodetails)
  app.component('currenttogo-details', currenttogo)

  if (import.meta.env.DEV) {
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('[Vue warn]', msg, trace)
    }
    app.config.errorHandler = (err, instance, info) => {
      console.error('[Vue error]', err, info, instance)
    }
  }

  try {
    await store.dispatch('initializeAuth')
  } catch (err) {
    console.error('Failed to initialize Firebase Auth:', err)
  }

  await router.isReady()

  app.mount('#app')

  if (import.meta.env.DEV) {
    window.store = store
  }
}

bootstrap()