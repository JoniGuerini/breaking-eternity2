const STORAGE_KEY = "breaking_eternity_device_id"

function generateId(): string {
  return crypto.randomUUID()
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return generateId()
  }
}
