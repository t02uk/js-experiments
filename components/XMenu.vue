<template>
  <div class="menu-container">
    <ul class="menu">
      <li
        v-for="menuItem in menuItems"
        v-bind:key="menuItem.path"
        class="menu-item"
        v-bind:class="menuItem.class"
        @click="clicked(menuItem)"
      />
    </ul>
    <effective-text v-bind:text="menuName" class="effectiveText" />
  </div>
</template>

<style>
.menu-container {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
}
.menu {
  margin-top: 4px;
  padding: 0px;
}
.menu-item {
  display: inline-block;
  width: 9px;
  height: 9px;
  background: #222;
  border-radius: 5px;
  list-style: none;
  border: solid 2px #888;
  margin: 2px;
}
.menu-item:hover {
  cursor: pointer;
  border: solid 2px #fff;
}
.menu-item_active {
  border: solid 2px #fff;
  background: #fff;
}

.effectiveText {
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
  data: () => {
    return {
      menuItems: [],
      menuName: '↑ Select any title'
    }
  },
  mounted: function() {
    const self = this
    Axios.get('json/user.json').then((response) => {
      self.menuItems = response.data
    })
  },
  methods: {
    clicked: function(menuItem) {
      this.menuName = menuItem.title
      for (const itMenuItem of this.menuItems) {
        itMenuItem.class =
          itMenuItem.path !== menuItem.path
            ? 'menu-item'
            : 'menu-item menu-item_active'
      }
      this.$store.commit('menu/changePath', menuItem.path)
    }
  }
}
</script>
