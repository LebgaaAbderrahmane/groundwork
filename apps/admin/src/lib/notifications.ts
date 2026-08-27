import { isTauri } from '@tauri-apps/api/core'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification'

let granted = false

export async function ensureNotificationPermission() {
  if (!isTauri()) return false
  granted = await isPermissionGranted()
  if (!granted) {
    granted = (await requestPermission()) === 'granted'
  }
  return granted
}

export function isDesktopApp(): boolean {
  return isTauri()
}

export function notify(title: string, body?: string) {
  if (!isTauri() || !granted) return
  try {
    sendNotification({ title, body })
  } catch {
    // notification failed — fall back silently
  }
}
