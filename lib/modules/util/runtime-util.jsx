
module.exports = {
    isElectron: () => {
        return window.process && window.process.versions && window.process.versions.electron
    }
}
