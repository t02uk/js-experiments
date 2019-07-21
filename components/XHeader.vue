<template>
  <header>
    <h1><img src="images/beaker.png" class="beaker" /> Experiments</h1>
    <div class="separator" />
    <x-menu />
  </header>
</template>

<style>
header {
  display: flex;
  align-items: center;
  width: 100%;
  background: #000;
  height: 3.5rem;
}

.beaker {
  width: 1.2rem;
  height: 1.2rem;
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
