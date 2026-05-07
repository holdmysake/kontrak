import { DataTypes } from 'sequelize'
import sequelize from '../sequelize.js'
import bcrypt from 'bcrypt'

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    uid: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'user',
    timestamps: false
})

// Method untuk validasi password
User.prototype.validatePassword = async function(password) {
    // log both hashed password and this.password
    console.log('Validating password:', { password, hashedPassword: this.password })
    return await bcrypt.compare(password, this.password)
}

export default User