import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

export const authMiddleware = (req, res, next) => {
    try {
        // Ambil token dari header
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan. Silakan login terlebih dahulu'
            })
        }

        // Ekstrak token
        const token = authHeader.substring(7) // Remove 'Bearer ' prefix

        // Verifikasi token
        const decoded = jwt.verify(token, JWT_SECRET)

        // Simpan user info ke request
        req.user = decoded

        next()
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid'
            })
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token sudah kadaluarsa. Silakan login kembali'
            })
        }

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat verifikasi token',
            error: error.message
        })
    }
}