import express from 'express'
import cors from 'cors'
import sequelize from './sequelize.js'
import dotenv from 'dotenv'

dotenv.config()

import { models } from './models/index.js'
import defineAssociations from './models/association.js'

import userRoutes from './routes/user.route.js'
import contractRoutes from './routes/contract.route.js'

const app = express()
const PORT = process.env.PORT || 3000

defineAssociations(models)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/user', userRoutes)
app.use('/api/contract', contractRoutes)

const startServer = async () => {
    try {
        await sequelize.authenticate()
        console.log('✓ Database connected')

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} mantap`)
        })
    } catch (err) {
        console.error('Unable to connect to database:', err)
        process.exit(1)
    }
}

startServer()