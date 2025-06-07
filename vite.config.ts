import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import bodyParser from 'body-parser'
import { IncomingMessage, ServerResponse } from 'http'

const MOCK_API_DIR = path.resolve(__dirname, 'src/data/mock_api_data')
const CAMPAIGNS_FILE_PATH = path.join(MOCK_API_DIR, 'campaigns.json')

if (!fs.existsSync(MOCK_API_DIR)) {
  fs.mkdirSync(MOCK_API_DIR, { recursive: true })
}
if (!fs.existsSync(CAMPAIGNS_FILE_PATH)) {
  fs.writeFileSync(CAMPAIGNS_FILE_PATH, '[]')
}

interface CustomIncomingMessage extends IncomingMessage {
  body?: any
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use('/api/save-campaigns', bodyParser.json())

        server.middlewares.use((req: CustomIncomingMessage, res: ServerResponse, next) => {
          if (req.url === '/api/save-campaigns' && req.method === 'POST') {
            const { campaigns } = req.body
            if (!campaigns) {
              res.statusCode = 400
              res.end('Missing campaigns data')
              return
            }
            fs.writeFileSync(CAMPAIGNS_FILE_PATH, JSON.stringify(campaigns, null, 2))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ message: 'Campaigns saved successfully.' }))
            return
          }

          if (req.url === '/api/load-campaigns' && req.method === 'GET') {
            if (fs.existsSync(CAMPAIGNS_FILE_PATH)) {
              const campaigns = JSON.parse(fs.readFileSync(CAMPAIGNS_FILE_PATH, 'utf-8'))
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ campaigns, message: 'Campaigns loaded successfully.' }))
            } else {
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 404
              res.end(JSON.stringify({ message: 'Campaigns file not found.', campaigns: [] }))
            }
            return
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
})
