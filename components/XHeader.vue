<template>
  <header>
    <h1>
      <img src="images/beaker.png" class="logo" />
      <span class="header-title">
        Experiments
      </span>
    </h1>
    <div class="separator" />
    <x-menu />
  </header>
</template>

<style scoped>
header {
  display: flex;
  align-items: center;
  width: 100%;
  background: #000;
  min-height: 3.5rem;
}

.logo {
  width: 1.5rem;
  height: 1.5rem;
}

.separator {
  border-left: solid 1px #555;
  height: 85%;
  margin-left: 10px;
  margin-right: 10px;
}

h1 {
  color: #fff;
  font-size: 130%;
  margin-left: 0.7rem;
  height: 1rem;
  vertical-align: bottom;
}

@media (max-width: 640px) {
  .header-title {
    display: none;
  }
}
</style>

<script>
import XMenu from '~/components/XMenu.vue'

export default {
  components: {
    XMenu
  }
}
</script>
