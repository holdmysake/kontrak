import { DataTypes } from 'sequelize'
import sequelize from '../sequelize.js'

const Contract = sequelize.define('Contract', {
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
    no_contract: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    title: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    company: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    init_value: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    curr_value: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'on_hold'),
        allowNull: false
    },
    value_status: {
        type: DataTypes.ENUM('good', 'warning', 'bad', 'minus'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_by: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    updated_by: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'contract',
    timestamps: false
})

export default Contract