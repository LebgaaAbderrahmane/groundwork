let _dirty = false
let _listeners: Array<() => void> = []

export function isUnsavedDirty() {
  return _dirty
}

export function setUnsavedDirty(value: boolean) {
  _dirty = value
  _listeners.forEach((l) => l())
}

export function subscribeUnsaved(listener: () => void) {
  _listeners.push(listener)
  return () => {
    _listeners = _listeners.filter((l) => l !== listener)
  }
}
