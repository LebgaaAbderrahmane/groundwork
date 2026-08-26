export function haptic(pattern: 'light' | 'medium' | 'heavy' = 'light') {
  if (!navigator.vibrate) return
  const patterns = { light: 10, medium: 20, heavy: 30 }
  navigator.vibrate(patterns[pattern])
}
