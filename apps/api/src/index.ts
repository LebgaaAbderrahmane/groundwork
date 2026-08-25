import { createApp } from './app'
import { env } from './env'

createApp().listen(env.PORT, () => {
  console.log(`Cribstone API listening on :${env.PORT}`)
})
