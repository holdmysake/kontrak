import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import sequelize from '../sequelize.js'
import User from '../models/user.model.js'
import bcrypt from 'bcrypt'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generateUID() {
    return crypto.randomBytes(8).toString('hex').substring(0, 15)
}

async function manageUser(filePath) {
    try {
        // Read file
        const fileContent = fs.readFileSync(filePath, 'utf8')
        
        // Parse data
        const data = {}
        fileContent.split('\n').forEach(line => {
            const [key, value] = line.split('=')
            if (key && value) {
                data[key.trim()] = value.trim()
            }
        })

        // Validate required fields
        if (!data.username || !data.name || !data.password) {
            throw new Error('Username, name, dan password harus diisi!')
        }

        if (data.username.length < 3) {
            throw new Error('Username minimal 3 karakter!')
        }

        if (data.password.length < 6) {
            throw new Error('Password minimal 6 karakter!')
        }

        // Connect to database
        await sequelize.authenticate()
        console.log('Terhubung ke database')
        console.log('')

        // Check if user exists
        const existingUser = await User.findOne({
            where: { username: data.username }
        })

        const hashedPassword = await bcrypt.hash(data.password, 10)

        if (existingUser) {
            // Update password (hooks akan auto-hash)
            await existingUser.update({
                password: hashedPassword
            })

            console.log('=========================================')
            console.log('  PASSWORD BERHASIL DIUBAH!')
            console.log('=========================================')
            console.log('')
            console.log('Username: ' + existingUser.username)
            console.log('Nama:     ' + existingUser.name)
            console.log('UID:      ' + existingUser.uid)
            console.log('')
            console.log('User dapat login dengan password baru')
        } else {
            // Create new user (hooks akan auto-hash)
            const newUser = await User.create({
                uid: generateUID(),
                username: data.username,
                name: data.name,
                password: hashedPassword
            })

            console.log('=========================================')
            console.log('  USER BARU BERHASIL DIBUAT!')
            console.log('=========================================')
            console.log('')
            console.log('Username: ' + newUser.username)
            console.log('Nama:     ' + newUser.name)
            console.log('UID:      ' + newUser.uid)
            console.log('')
            console.log('User dapat login ke sistem')
        }

        console.log('=========================================')
        console.log('')

        // Clear the file after successful operation
        fs.writeFileSync(filePath, 'username=\nname=\npassword=', 'utf8')

    } catch (error) {
        console.error('ERROR: ' + error.message)
        throw error
    } finally {
        await sequelize.close()
    }
}

// Get file path from command line argument or use default
const filePath = process.argv[2] || path.join(__dirname, '../../new_user.txt')

manageUser(filePath)
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.error('')
        console.error('Operasi gagal!')
        process.exit(1)
    })