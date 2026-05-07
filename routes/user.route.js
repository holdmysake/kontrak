import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import User from '../models/user.model.js'
import bcrypt from 'bcrypt'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

// Generate UID
function generateUID() {
    return crypto.randomBytes(8).toString('hex').substring(0, 15)
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, name, password } = req.body

        // Validasi input
        if (!username || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, name, dan password harus diisi'
            })
        }

        // Cek username sudah ada
        const existingUser = await User.findOne({ where: { username } })
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan'
            })
        }

        // Buat user baru
        const uid = generateUID()
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            uid,
            username,
            name,
            password: hashedPassword
        })

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: {
                uid: newUser.uid,
                username: newUser.username,
                name: newUser.name
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat registrasi',
            error: error.message
        })
    }
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        // Validasi input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password harus diisi'
            })
        }

        // Cari user
        const user = await User.findOne({ where: { username } })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            })
        }

        // Validasi password
        const isValidPassword = await user.validatePassword(password)
        console.log('Password validation:', { username, isValidPassword })
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            })
        }

        // Generate token
        const token = jwt.sign(
            {
                uid: user.uid,
                username: user.username,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        res.json({
            success: true,
            message: 'Login berhasil',
            data: {
                uid: user.uid,
                username: user.username,
                name: user.name,
                token
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login',
            error: error.message
        })
    }
})

// Get Profile (protected route)
router.post('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uid: req.user.uid },
            attributes: ['uid', 'username', 'name']
        })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            })
        }

        res.json({
            success: true,
            data: user
        })
    } catch (error) {
        console.error('Get profile error:', error)
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil profil',
            error: error.message
        })
    }
})

export default router