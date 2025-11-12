<script setup>
import { RouterView } from 'vue-router'

</script>

<template>
  <v-app>
    <template v-if="requiresAuth && authLoading">
      <v-main class="d-flex align-center justify-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      </v-main>
    </template>

    <template v-else-if="showLogin">
      <v-main class="d-flex align-center justify-center">
        <v-container class="d-flex justify-center">
          <v-card width="420" elevation="4">
            <v-card-title class="text-h5 font-weight-bold">
              China Buffet POS Login
            </v-card-title>
            <v-card-subtitle>
              Please sign in with your staff account to continue.
            </v-card-subtitle>
            <v-card-text>
              <v-alert
                v-if="displayAuthError"
                type="error"
                variant="tonal"
                class="mb-4"
              >
                {{ displayAuthError }}
              </v-alert>
              <v-text-field
                v-model="loginEmail"
                type="email"
                label="Email"
                autocomplete="username"
                prepend-icon="mdi-email-outline"
                @keyup.enter="login"
              ></v-text-field>
              <v-text-field
                v-model="loginPassword"
                type="password"
                label="Password"
                autocomplete="current-password"
                prepend-icon="mdi-lock-outline"
                @keyup.enter="login"
              ></v-text-field>
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
              <v-btn
                color="primary"
                block
                :loading="authLoading"
                @click="login"
              >
                Sign In
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-container>
      </v-main>
    </template>

    <template v-else>
      <v-navigation-drawer 
        v-if="isAdmin"
        v-model="drawer"
        temporary
      >
        <v-list-item
          prepend-avatar="https://randomuser.me/api/portraits/men/78.jpg"
          title="China Buffet"
        />

        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-store"
          title="Home"
          to="/"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-food-takeout-box"
          title="Order"
          to="about"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item
          prepend-icon="mdi-receipt"
          title="Cashier"
          to="cashier"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-currency-usd">
          Total ${{ totalRevenue }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-silverware-fork-knife">
          Buffet ${{ buffetRevenue }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-account-multiple">
          {{ $store.state.sales.totalCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-account">
          {{ $store.state.sales.adultCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-nintendo-game-boy">
          {{ $store.state.sales.bigKidCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-teddy-bear">
          {{ $store.state.sales.smlKidCount }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-food-takeout-box-outline">
          Togo ${{ togoRevenue }}
        </v-list-item>
        <v-divider></v-divider>
        <v-list-subheader>Admin Tools</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-lead-pencil"
          title="Manage Menu"
          @click="openMenuManager"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-receipt"
          title="View To-Go Sales"
          @click="openTogoSales"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-trash-can-outline"
          title="Reset Sales Data"
          @click="showResetConfirm = true"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item>
          <v-btn color="primary" variant="outlined" block @click="logout">
            <v-icon start>mdi-logout</v-icon>
            Sign Out
          </v-btn>
        </v-list-item>
      </v-navigation-drawer>

      <v-app-bar :elevation="2">
        <v-app-bar-nav-icon v-if="isAdmin" @click="drawer = !drawer" />
        <v-app-bar-title>China Buffet</v-app-bar-title>
        <v-btn-toggle
          v-model="priceMode"
          mandatory
          density="comfortable"
          variant="outlined"
          class="ml-4"
        >
          <v-btn value="lunch">
            <v-icon start size="18">mdi-white-balance-sunny</v-icon>
            Lunch
          </v-btn>
          <v-btn value="dinner">
            <v-icon start size="18">mdi-weather-night</v-icon>
            Dinner
          </v-btn>
        </v-btn-toggle>
        <v-btn
          class="ml-4"
          variant="outlined"
          color="primary"
          :to="{ name: 'cashier' }"
        >
          <v-icon start>mdi-receipt</v-icon>
          Cashier
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="requiresAuth"
          icon
          variant="text"
          color="primary"
          @click="logout"
          :title="'Sign Out'"
        >
          <v-icon>mdi-logout</v-icon>
        </v-btn>
        <v-layout style="height: 56px;">
          <v-bottom-navigation v-model="toggleTogo">
            <v-btn value>
              <v-icon
                size="x-large"
                :style="($store.state.seletedTogo.length !== 0) ? {'color': 'red'} : {'color': 'black'}"
              >
                mdi-food-takeout-box-outline
              </v-icon>
              <span>Togo</span>
            </v-btn>
            <div v-if="$store.state.totalTogoPrice !== 0">
              <v-chip class="ma-2" label color="red">
                ${{ $store.state.totalTogoPrice }}
              </v-chip>
            </div>
          </v-bottom-navigation>
        </v-layout>
      </v-app-bar>

      <v-main>
        <RouterView />
        <currenttogo-details v-model="toggleTogo"></currenttogo-details>
      </v-main>

      <admin-menu-manager
        v-model="showMenuManager"
        :menu="$store.state.menu"
        :saving="menuSaving"
        @save="handleMenuSave"
      />

      <admin-togo-sales
        v-model="showTogoSales"
        :sales="togoSalesHistory"
        :loading="togoSalesLoading"
      />

      <v-dialog v-model="showResetConfirm" max-width="420">
        <v-card>
          <v-card-title class="text-h6">Reset Sales Data</v-card-title>
          <v-card-text>
            This will clear the sales summary and history. This action cannot be undone.
            Are you sure you want to continue?
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showResetConfirm = false">Cancel</v-btn>
            <v-btn
              color="red"
              variant="flat"
              :loading="resetLoading"
              @click="performResetSales"
            >
              Reset
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        timeout="3000"
      >
        {{ snackbarMessage }}
        <template #actions>
          <v-btn variant="text" @click="snackbar = false">Dismiss</v-btn>
        </template>
      </v-snackbar>
    </template>
  </v-app>
</template>

<script>
import AdminMenuManager from './components/AdminMenuManager.vue'
import AdminTogoSales from './components/AdminTogoSales.vue'

export default {
  components: {
    AdminMenuManager,
    AdminTogoSales
  },
  props: {
        // adultNo: 
    },
  data: () => ({ 
    drawer: null,
    toggleTogo: false,
    loginEmail: '',
    loginPassword: '',
    localAuthError: '',
    // detailCompose: false,
    sideBarList: [
      {title: 'Home', icon: 'mdi-view-dashboard', to:'/'},
      {title: 'About', icon: 'mdi-forum', to:'/about'}
    ],
    showMenuManager: false,
    showResetConfirm: false,
    menuSaving: false,
    resetLoading: false,
    snackbar: false,
    snackbarMessage: '',
    snackbarColor: 'success',
    showTogoSales: false,
    togoSalesLoading: false,
    togoSalesHistory: []
  }),
  methods: {
    async login() {
      this.localAuthError = ''
      if (!this.loginEmail || !this.loginPassword) {
        this.localAuthError = 'Email and password are required.'
        return
      }
      try {
        await this.$store.dispatch('signIn', {
          email: this.loginEmail.trim(),
          password: this.loginPassword
        })
        this.loginPassword = ''
      } catch (error) {
        console.error('Login failed:', error)
      }
    },
    async logout() {
      await this.$store.dispatch('signOut')
      this.drawer = false
    },
    openMenuManager() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showMenuManager = true
    },
    async openTogoSales() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showTogoSales = true
      this.togoSalesLoading = true
      try {
        const history = await this.$store.dispatch('loadTogoSalesHistory')
        this.togoSalesHistory = history
      } catch (error) {
        console.error('Failed to load togo sales history:', error)
        this.snackbarMessage = 'Failed to load to-go sales history'
        this.snackbarColor = 'error'
        this.snackbar = true
      } finally {
        this.togoSalesLoading = false
      }
    },
    async handleMenuSave(menu) {
      this.menuSaving = true
      try {
        await this.$store.dispatch('updateMenuFromAdmin', menu)
        this.snackbarMessage = 'Menu updated successfully'
        this.snackbarColor = 'success'
        this.snackbar = true
        this.showMenuManager = false
      } catch (error) {
        console.error('Failed to update menu:', error)
        this.snackbarMessage = 'Failed to update menu'
        this.snackbarColor = 'error'
        this.snackbar = true
      } finally {
        this.menuSaving = false
      }
    },
    async performResetSales() {
      this.resetLoading = true
      try {
        const result = await this.$store.dispatch('resetSalesData')
        if (result?.success) {
          this.snackbarMessage = 'Sales data reset successfully'
          this.snackbarColor = 'success'
        } else {
          this.snackbarMessage = result?.error || 'Failed to reset sales data'
          this.snackbarColor = 'error'
        }
        this.snackbar = true
        this.showResetConfirm = false
      } catch (error) {
        console.error('Failed to reset sales data:', error)
        this.snackbarMessage = 'Failed to reset sales data'
        this.snackbarColor = 'error'
        this.snackbar = true
      } finally {
        this.drawer = false
        this.resetLoading = false
      }
    }
  },
  computed: {
    priceMode: {
      get() {
        return this.$store.state.isDinner ? 'dinner' : 'lunch'
      },
      set(value) {
        this.$store.commit('setDinnerMode', value === 'dinner')
      }
    },
    requiresAuth() {
      return this.$store.state.useFirebase
    },
    authLoading() {
      return this.$store.state.authLoading
    },
    isAuthenticated() {
      if (!this.requiresAuth) return true
      return !!this.$store.state.authUser
    },
    showLogin() {
      return this.requiresAuth && !this.authLoading && !this.isAuthenticated
    },
    displayAuthError() {
      return this.localAuthError || this.$store.state.authError
    },
    userEmail() {
      return this.$store.state.authUser?.email || ''
    },
    isAdmin() {
      return this.$store.getters.isAdmin
    },
    totalRevenue() {
      const revenue = parseFloat(this.$store.state.sales.revenue || 0)
      return revenue.toFixed(2)
    },
    togoRevenue() {
      const togo = parseFloat(this.$store.state.sales.totalTogoRevenue || 0)
      return togo.toFixed(2)
    },
    buffetRevenue() {
      const revenue = parseFloat(this.$store.state.sales.revenue || 0)
      const togo = parseFloat(this.$store.state.sales.totalTogoRevenue || 0)
      const buffet = Math.max(0, revenue - togo)
      return buffet.toFixed(2)
    }
  },
  watch: {
    loginEmail() {
      if (this.localAuthError) {
        this.localAuthError = ''
      }
      if (this.requiresAuth && this.$store.state.authError) {
        this.$store.commit('setAuthError', null)
      }
    },
    loginPassword() {
      if (this.localAuthError) {
        this.localAuthError = ''
      }
      if (this.requiresAuth && this.$store.state.authError) {
        this.$store.commit('setAuthError', null)
      }
    },
    '$store.state.authUser'(user) {
      if (user) {
        this.drawer = false
      }
    },
    isAdmin(value) {
      if (!value) {
        this.drawer = false
        this.showMenuManager = false
        this.showResetConfirm = false
        this.showTogoSales = false
      }
    }
  }
}
</script>
<style>
* {
    -ms-touch-action: manipulation;
    touch-action: manipulation;
}
</style>