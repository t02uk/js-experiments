<template>
  <div class="menu-container">
    <ul class="menu">
      <li
        v-for="menuItem in menuItems"
        v-bind:key="menuItem.path"
        class="menu__item"
        v-bind:class="menuItem.class"
        @click="clicked(menuItem)"
        @mouseover="mouseovered(menuItem)"
        @mouseleave="mouseleaved()"
      />
    </ul>
    <effective-text v-bind:text="menuName" class="effective-text" />
  </div>
</template>

<style scoped>
.menu-container {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
}
.menu {
  margin-top: 4px;
  padding: 0px;
}
.menu__item {
  display: inline-block;
  width: 9px;
  height: 9px;
  background: #222;
  border-radius: 5px;
  list-style: none;
  border: solid 2px #888;
  margin: 2px;
}
.menu__item:hover {
  cursor: pointer;
  border: solid 2px #fff;
}
.menu__item--active {
  border: solid 2px #fff;
  background: #fff;
}

.effective-text {
  margin-top: 2px;
}
</style>

<script>
import Axios from 'Axios'
import EffectiveText from '~/components/EffectiveText.vue'

export default {
  components: {
    EffectiveText
  },
  data() {
    return {
      menuItems: [],
      fixedMenuName: '',
      temporalMenuName: ''
    }
  },
  mounted() {
    const self = this
    Axios.get('json/user.json').then((response) => {
      self.menuItems = response.data
      self.clicked(self.menuItems[0])
    })
  },
  methods: {
    clicked(menuItem) {
      if (menuItem.confirmMessage) {
        if (!confirm(menuItem.confirmMessage)) {
          return
        }
      }
      for (let i = 0; i < this.menuItems.length; i++) {
        const itMenuItem = this.menuItems[i]
        itMenuItem.class =
          itMenuItem.path !== menuItem.path
            ? 'menu--item'
            : 'menu--item menu__item--active'
        this.$set(this.menuItems, i, itMenuItem)
      }
      this.fixedMenuName = menuItem.title
      this.$store.commit('menu/changePath', menuItem.path)
    },
    mouseovered(menuItem) {
      this.temporalMenuName = menuItem.title
    },
    mouseleaved() {
      this.temporalMenuName = ''
    }
  },
  computed: {
    menuName() {
      return this.temporalMenuName || this.fixedMenuName
    }
  }
}
</script>
