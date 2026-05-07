import sequelize from '../sequelize.js'
import User from '../models/user.model.js'

async function listUsers() {
    try {
        await sequelize.authenticate()

        const users = await User.findAll({
            attributes: ['uid', 'username', 'name']
        })

        if (users.length === 0) {
            console.log('Belum ada user dalam database.')
            return
        }

        console.log('==========================================')
        console.log('  DAFTAR SEMUA USER')
        console.log('==========================================')
        console.log('')

        users.forEach((user, index) => {
            const num = String(index + 1).padStart(2, '0')
            console.log(num + '. ' + user.username)
            console.log('    Nama:    ' + user.name)
            console.log('    UID:     ' + user.uid)
            console.log('──────────────────────────────────────────')
        })

        console.log('')
        console.log('Total User: ' + users.length)
        console.log('')

    } catch (error) {
        console.error('ERROR: ' + error.message)
    } finally {
        await sequelize.close()
    }
}

listUsers()