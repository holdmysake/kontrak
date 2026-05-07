import { DataTypes } from 'sequelize'
import sequelize from '../sequelize.js'

const ContractUsage = sequelize.define('ContractUsage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    contract_id: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    claim_type: {
        type: DataTypes.ENUM('daily', 'weekly', 'two-weekly', 'monthly', 'two-monthly'),
        allowNull: false
    },
    claim_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    claim_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    value_usage: {
        type: DataTypes.DOUBLE,
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
    created_at: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'contract_usage',
    timestamps: false
})

export default ContractUsage