/**
 * Auth Module
 * Handles authentication state, user management, and role determination
 */

import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../../firebase'

const ADMIN_EMAILS = (import.meta.env.VITE_FIREBASE_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

function determineRoleForUser(user) {
  const email = (user?.email || '').toLowerCase()
  if (email && ADMIN_EMAILS.includes(email)) {
    return 'admin'
  }
  return 'server'
}

export default {
  namespaced: true,
  
  state: {
    authUser: null,
    authLoading: false,
    authError: null,
    authUnsubscriber: null,
    authRole: 'server',
  },

  getters: {
    isAdmin(state) {
      return state.authRole === 'admin'
    },
    isServer(state) {
      return state.authRole === 'server'
    },
    isAuthenticated(state) {
      return !!state.authUser
    }
  },

  mutations: {
    setAuthLoading(state, value) {
      state.authLoading = value
    },
    
    setAuthUser(state, user) {
      state.authUser = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null
    },
    
    setAuthError(state, error) {
      state.authError = error || null
    },
    
    setAuthUnsubscriber(state, unsub) {
      if (state.authUnsubscriber && typeof state.authUnsubscriber === 'function') {
        try {
          state.authUnsubscriber()
        } catch (err) {
          console.error('[Firebase] Failed to remove auth listener:', err)
        }
      }
      state.authUnsubscriber = typeof unsub === 'function' ? unsub : null
    },
    
    setAuthRole(state, role) {
      state.authRole = role === 'admin' ? 'admin' : 'server'
    }
  },

  actions: {
    /**
     * Initialize Firebase Auth and set up auth state listener
     */
    async initializeAuth({ state, commit, dispatch, rootState }) {
      if (!rootState.firebase.useFirebase) {
        return Promise.resolve()
      }
      if (!auth) {
        console.warn('[Firebase] Auth is not configured. Check environment variables.')
        commit('setAuthLoading', false)
        return Promise.resolve()
      }
      if (state.authUnsubscriber) {
        return Promise.resolve()
      }
      
      commit('setAuthLoading', true)
      commit('setAuthError', null)

      const unsubscribePromise = new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, async user => {
          try {
            if (user) {
              commit('setAuthUser', user)
              commit('setAuthRole', determineRoleForUser(user))
              commit('setAuthError', null)
              await dispatch('firebase/initializeFirebase', null, { root: true })
            } else {
              commit('setAuthUser', null)
              commit('setAuthRole', 'server')
              await dispatch('firebase/cleanupFirebase', null, { root: true })
            }
          } finally {
            commit('setAuthLoading', false)
            resolve()
          }
        }, error => {
          console.error('[Firebase] Auth state change error:', error)
          commit('setAuthError', error.message)
          commit('setAuthLoading', false)
          resolve()
        })
        commit('setAuthUnsubscriber', unsubscribe)
      })

      return unsubscribePromise
    },

    /**
     * Sign in with email and password
     */
    async signIn({ commit }, { email, password }) {
      if (!auth) {
        throw new Error('Firebase Auth is not configured. Check environment variables.')
      }
      commit('setAuthLoading', true)
      commit('setAuthError', null)
      try {
        await signInWithEmailAndPassword(auth, email, password)
      } catch (error) {
        console.error('[Firebase] Sign-in failed:', error)
        commit('setAuthError', error.message)
        commit('setAuthLoading', false)
        throw error
      }
    },

    /**
     * Sign out current user
     */
    async signOut({ commit, dispatch }) {
      if (!auth) {
        return
      }
      try {
        await firebaseSignOut(auth)
      } catch (error) {
        console.error('[Firebase] Sign-out failed:', error)
      } finally {
        commit('setAuthUser', null)
        commit('setAuthRole', 'server')
        commit('setAuthLoading', false)
        await dispatch('firebase/cleanupFirebase', null, { root: true })
      }
    }
  }
}

