import { createApp } from './app'
import { env } from './env'

createApp().listen(env.PORT, () => {
  console.log(`Groundwork API listening on :${env.PORT}`)
})
