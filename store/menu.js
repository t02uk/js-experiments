export const state = () => ({
  path: 'frame/launcher.html?path=sY52'
})

export const mutations = {
  changePath(state, path) {
    state.path = path
  }
}

export const getters = {
  path(state) {
    return state.path
  }
}
