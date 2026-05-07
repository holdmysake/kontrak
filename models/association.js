export default function defineAssociations(models) {
    const { Contract, ContractUsage, User } = models

    // Contract has many ContractUsage
    Contract.hasMany(ContractUsage, {
        foreignKey: 'contract_id',
        sourceKey: 'uid',
        as: 'usages'
    })

    ContractUsage.belongsTo(Contract, {
        foreignKey: 'contract_id',
        targetKey: 'uid',
        as: 'contract'
    })

    // Contract created by User
    Contract.belongsTo(User, {
        foreignKey: 'created_by',
        targetKey: 'uid',
        as: 'creator'
    })

    // Contract updated by User
    Contract.belongsTo(User, {
        foreignKey: 'updated_by',
        targetKey: 'uid',
        as: 'updater'
    })

    // ContractUsage created by User
    ContractUsage.belongsTo(User, {
        foreignKey: 'created_by',
        targetKey: 'uid',
        as: 'creator'
    })
}