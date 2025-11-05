import { createApp, defineEventHandler, setResponseHeader, getMethod, setResponseStatus } from 'h3'
import handleSubmit from './handlers/submit'

const app = createApp()

// CORS middleware
app.use('/**', defineEventHandler((event) => {
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  setResponseHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  setResponseHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 200)
    return { status: 'ok' }
  }
}))

// Routes
app.use('/submit/:formId', defineEventHandler(async (event) => {
  return handleSubmit(event)
}))

app.use('/health', defineEventHandler(() => {
  return {
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
  }
}))

export default app
