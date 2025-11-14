<script setup>
import { RouterView } from 'vue-router'

</script>

<template>
  <v-app>
    <template v-if="requiresAuth && (authLoading || (isAuthenticated && !firebaseReady))">
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
                color="accent"
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
        :color="drawerColor"
        border="0"
        :elevation="0"
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
          prepend-icon="mdi-chart-line"
          title="Live Sales"
          @click="openLiveSales"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-trash-can-outline"
          title="Reset Sales Data"
          @click="showResetConfirm = true"
        ></v-list-item>
        <v-divider></v-divider>
        <v-list-item>
          <v-btn color="accent" variant="outlined" block @click="logout">
            <v-icon start>mdi-logout</v-icon>
            Sign Out
          </v-btn>
        </v-list-item>
      </v-navigation-drawer>

      <v-main :class="['pos-main', priceMode]">
        <div class="pos-shell">
          <header v-if="!isCashierRoute" class="pos-header">
            <div class="pos-header__left">
              <div class="pos-brand">
                <v-btn
                  v-if="isAdmin"
                  icon
                  variant="text"
                  color="accent"
                  @click="drawer = !drawer"
                  class="pos-brand__drawer"
                >
                  <v-icon>mdi-menu</v-icon>
                </v-btn>
                <span class="pos-brand__title">China Buffet</span>
                <span class="pos-brand__mode">Staff POS</span>
              </div>
              <v-btn-toggle
                v-model="priceMode"
                mandatory
                density="comfortable"
                variant="outlined"
                class="price-toggle"
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
            </div>
            <div class="pos-header__actions">
            </div>
          </header>

          <section class="pos-content">
            <div class="pos-content__primary">
          <RouterView v-if="firebaseReady" />
            </div>
            <aside v-if="showOrderPanel" class="pos-content__panel">
          <component
            v-if="activeOrderPanelComponent"
            :is="activeOrderPanelComponent"
            v-bind="activeOrderPanelProps"
            @manage-table="handlePanelManageTable"
            @print-table="handlePanelPrintTable"
            @pay-table="handlePanelPayTable"
            @edit="handlePanelEditItems"
            @print="handlePanelPrintTogo"
            @paid="handlePanelTogoPaid"
          />
          <cashier-receipt-panel v-else-if="isCashierRoute" />
          <div v-else class="pos-content__panel-placeholder">
            <v-icon size="42" color="accent">mdi-receipt-outline</v-icon>
            <p class="text-subtitle-1 font-weight-medium mt-3">
              Orders you open will appear here.
            </p>
            <p class="text-body-2 text-medium-emphasis">
              Select a table or build a to-go order to review items, actions, and guest details.
            </p>
          </div>
            </aside>
          </section>
        </div>
        <currenttogo-details
          v-if="firebaseReady"
          ref="currentTogoDialog"
          v-model="togoDialogOpen"
          @edit="openTogoEditFromCurrent"
        ></currenttogo-details>
        <togo-edit-items
          v-if="firebaseReady"
          v-model="togoEditDialogOpen"
        ></togo-edit-items>
      </v-main>

      <v-bottom-navigation
        class="pos-bottom-nav"
        grow
        :elevation="6"
        height="68"
        active-class="pos-bottom-nav__btn--active"
        v-model="bottomNav"
        @update:modelValue="handleBottomNavChange"
      >
        <v-btn
          v-for="item in bottomNavItems"
          :key="item.value"
          :value="item.value"
          :to="item.to"
          :ripple="false"
          :disabled="item.disabled"
        >
          <span class="pos-bottom-nav__icon">
            <v-icon :icon="item.icon"></v-icon>
          </span>
          <span class="pos-bottom-nav__label">{{ item.label }}</span>
        </v-btn>
      </v-bottom-navigation>

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
      <admin-live-sales
        v-model="showLiveSales"
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
import AdminLiveSales from './components/AdminLiveSales.vue'
import TableOrderPanel from './components/panels/TableOrderPanel.vue'
import TogoOrderPanel from './components/panels/TogoOrderPanel.vue'
import TogoEditItems from './components/TogoEditItems.vue'
import CashierReceiptPanel from './components/panels/CashierReceiptPanel.vue'

export default {
  components: {
    AdminMenuManager,
    AdminTogoSales,
    AdminLiveSales,
    TableOrderPanel,
    TogoOrderPanel,
    TogoEditItems,
    CashierReceiptPanel
  },
  props: {
        // adultNo: 
    },
  data: () => ({ 
    drawer: null,
    togoDialogOpen: false,
    togoEditDialogOpen: false,
    bottomNav: null,
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
    showLiveSales: false,
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
    openTogoDialog() {
      this.togoDialogOpen = true
    },
    handleBottomNavChange(value) {
      const item = this.bottomNavItems.find(entry => entry.value === value)
      if (!item) {
        return
      }
      if (item.action) {
        item.action()
        this.syncBottomNavWithRoute()
        return
      }
      if (item.to && item.to.name && this.$route.name !== item.to.name) {
        this.$router.push(item.to)
      }
    },
    syncBottomNavWithRoute() {
      this.bottomNav = this.resolveNavValue(this.$route.name)
    },
    resolveNavValue(routeName) {
      const match = this.bottomNavItems.find(item => item.to?.name === routeName)
      return match ? match.value : null
    },
    navigateTo(routeName) {
      if (this.$route.name !== routeName) {
        this.$router.push({ name: routeName })
      }
    },
    applyTheme(mode) {
      const themeName = mode === 'dinner' ? 'dinnerTheme' : 'lunchTheme'
      const theme = this.$vuetify && this.$vuetify.theme
      if (theme && theme.global && typeof theme.global.name === 'object' && 'value' in theme.global.name) {
        if (theme.global.name.value !== themeName) {
          theme.global.name.value = themeName
        }
      } else if (theme && theme.global && 'name' in theme.global) {
        theme.global.name = themeName
      }
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
    openLiveSales() {
      if (!this.isAdmin) {
        return
      }
      this.drawer = false
      this.showLiveSales = true
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
    },
    ensureRoute(target) {
      if (this.$route.name === target) {
        return Promise.resolve()
      }
      return this.$router.push({ name: target })
    },
    handlePanelManageTable(index) {
      const tableIndex = typeof index === 'number' ? index : this.$store.state.tableNum || 0
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex })
      this.ensureRoute('home').finally(() => {
        window.dispatchEvent(
          new CustomEvent('pos-open-table-details', { detail: { tableIndex } })
        )
      })
    },
    handlePanelPrintTable(index) {
      const tableIndex = typeof index === 'number' ? index : this.$store.state.tableNum || 0
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex })
      this.ensureRoute('home').finally(() => {
        window.dispatchEvent(
          new CustomEvent('pos-print-table', { detail: { tableIndex } })
        )
      })
    },
    handlePanelPayTable(index) {
      const tableIndex = typeof index === 'number' ? index : this.$store.state.tableNum || 0
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex })
      this.$store.commit('paid')
    },
    handlePanelEditItems() {
      this.togoDialogOpen = false
      this.togoEditDialogOpen = true
    },
    handlePanelPrintTogo() {
      const ref = this.$refs.currentTogoDialog
      if (ref && typeof ref.printTogoReceipt === 'function') {
        ref.printTogoReceipt()
        return
      }
      this.$store.commit('calculateTogoTotal')
    },
    handlePanelTogoPaid() {
      this.$store.commit('togoPaid')
    },
    openTogoEditFromCurrent() {
      this.togoDialogOpen = false;
      this.togoEditDialogOpen = true;
    }
  },
  computed: {
    priceMode: {
      get() {
        return this.$store.state.isDinner ? 'dinner' : 'lunch'
      },
      set(value) {
        this.$store.commit('setDinnerMode', value === 'dinner')
        this.applyTheme(value)
        if (this.$route.name !== 'home') {
          this.$router.push({ name: 'home' })
        }
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
    firebaseReady() {
      if (!this.requiresAuth) return true
      if (!this.$store.state.firebaseInitialized) return false
      if (!Array.isArray(this.$store.state.menu) || this.$store.state.menu.length === 0) return false
      if (!Array.isArray(this.$store.state.tables) || this.$store.state.tables.length === 0) return false
      return true
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
    bottomNavItems() {
      const items = [
        {
          value: 'logout',
          label: 'Log out',
          icon: 'mdi-logout',
          action: () => this.logout()
        },
        {
          value: 'home',
          label: 'Floor plan',
          icon: 'mdi-floor-plan',
          to: { name: 'home' }
        },
        {
          value: 'about',
          label: 'Menu',
          icon: 'mdi-view-grid-outline',
          to: { name: 'about' }
        }
      ]

      // Add Cashier tab for both admin and server users
      items.push({
        value: 'cashier',
        label: 'Cashier',
        icon: 'mdi-receipt',
        to: { name: 'cashier' }
      })

      if (this.isAdmin) {
        // Admin-only tabs
        items.push({
          value: 'admin',
          label: 'Admin',
          icon: 'mdi-dots-horizontal',
          action: () => {
            this.drawer = true
          }
        })
      }

      return items
    },
    showOrderPanel() {
      return !this.showLogin && !this.authLoading
    },
    isCashierRoute() {
      return this.$route.name === 'cashier'
    },
    activeOrderPanel() {
      return this.$store.state.orderPanel || { type: null }
    },
    activeOrderPanelComponent() {
      switch (this.activeOrderPanel.type) {
        case 'table':
          return TableOrderPanel
        case 'togo':
          return TogoOrderPanel
        default:
          return null
      }
    },
    activeOrderPanelProps() {
      if (this.activeOrderPanel.type === 'table') {
        return {
          tableIndex: this.activeOrderPanel.tableIndex ?? this.$store.state.tableNum ?? 0
        }
      }
      return {}
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
    },
    drawerColor() {
      return 'drawer'
    }
  },
  mounted() {
    this.applyTheme(this.priceMode)
    this.syncBottomNavWithRoute()
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
    '$store.state.isDinner'(value) {
      this.applyTheme(value ? 'dinner' : 'lunch')
    },
    isAdmin(value) {
      if (!value) {
        this.drawer = false
        this.showMenuManager = false
        this.showResetConfirm = false
        this.showTogoSales = false
        this.showLiveSales = false
      }
    },
    '$route.name'() {
      this.syncBottomNavWithRoute()
    }
  }
}
</script>
<style>
* {
    -ms-touch-action: manipulation;
    touch-action: manipulation;
}

.pos-main {
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--v-theme-background) 65%, #ffffff 35%),
    color-mix(in srgb, var(--v-theme-surface) 70%, #ffffff 30%)
  );
  color: var(--v-theme-on-background);
  transition: background 300ms ease, color 300ms ease;
  display: flex;
  flex-direction: column;
}

.pos-main.lunch,
.pos-main.dinner {
  background: radial-gradient(circle at top left, rgba(255, 231, 186, 0.6), transparent 45%),
              linear-gradient(180deg, rgba(253, 246, 234, 0.95), rgba(255, 255, 255, 0.92));
}

.pos-shell {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px 88px;
  gap: 24px;
}

.pos-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
  box-shadow: 0 12px 32px rgba(15, 25, 35, 0.12);
  backdrop-filter: blur(14px);
}

.pos-header__left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.pos-brand {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-weight: 600;
  font-size: 22px;
}

.pos-brand__title {
  letter-spacing: 0.2px;
}

.pos-brand__mode {
  font-size: 14px;
  font-weight: 500;
  color: color-mix(in srgb, var(--v-theme-primary) 75%, var(--v-theme-on-background) 25%);
}

.pos-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-toggle .v-btn {
  border-radius: 999px;
  transition: background-color 200ms ease, color 200ms ease, box-shadow 200ms ease;
  border: none;
}

.price-toggle .v-btn.v-btn--active {
  background-color: var(--v-theme-primary-soft);
  color: var(--v-theme-primary) !important;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}

.price-toggle .v-btn:not(.v-btn--active) {
  color: var(--v-theme-primary);
}

.pos-content {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

@media (min-width: 820px) {
   .pos-content {
     grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
   }
 }

.pos-content__primary {
  min-height: 0;
}

.pos-content__panel {
  background: color-mix(in srgb, var(--v-theme-surface) 92%, transparent);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 38px rgba(15, 25, 35, 0.16);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
}

.pos-content__panel-placeholder {
  text-align: center;
  padding: 24px 12px;
  border: 1px dashed color-mix(in srgb, var(--v-theme-primary) 40%, transparent);
  border-radius: 20px;
  background: color-mix(in srgb, var(--v-theme-surface) 88%, transparent);
}

.pos-main .v-card,
.pos-main .v-sheet,
.pos-main .v-dialog .v-card {
  background-color: color-mix(in srgb, var(--v-theme-surface) 90%, transparent);
  backdrop-filter: blur(12px);
  transition: background-color 300ms ease, color 300ms ease;
  border-radius: 18px;
}

.pos-main.lunch .v-card,
.pos-main.lunch .v-sheet,
.pos-main.lunch .v-dialog .v-card,
.pos-main.dinner .v-card,
.pos-main.dinner .v-sheet,
.pos-main.dinner .v-dialog .v-card {
  box-shadow: 0 10px 20px rgba(255, 192, 203, 0.18);
}

.pos-main .v-divider {
  border-color: color-mix(in srgb, var(--v-theme-primary) 35%, transparent);
}

.pos-bottom-nav {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: min(960px, calc(100% - 32px));
  border-radius: 32px;
  background: color-mix(in srgb, var(--v-theme-surface) 96%, transparent);
  box-shadow: 0 16px 36px rgba(15, 25, 35, 0.22);
  backdrop-filter: blur(16px);
  padding-inline: 12px;
}

.pos-bottom-nav__btn--active {
  background: color-mix(in srgb, var(--v-theme-primary-soft) 80%, transparent) !important;
  color: var(--v-theme-primary) !important;
}

.pos-bottom-nav__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}

.pos-bottom-nav__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.v-navigation-drawer {
  backdrop-filter: blur(18px);
  border-right: 1px solid color-mix(in srgb, var(--v-theme-primary) 12%, transparent) !important;
}
</style>