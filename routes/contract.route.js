import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import Contract from '../models/contract.model.js'
import User from '../models/user.model.js'
import crypto from 'crypto'
import ContractUsage from '../models/contract_usage.model.js'

const router = express.Router()

// Generate UID
function generateUID() {
    return crypto.randomBytes(8).toString('hex').substring(0, 15)
}

// Calculate value status only
function calculateValueStatus(start, end, init_value, curr_value, status) {
    const now = new Date()
    const startDate = new Date(start)
    const endDate = new Date(end)
    
    // Calculate time progress (%)
    const totalDuration = endDate - startDate
    const elapsedDuration = now - startDate
    const timeProgress = Math.min(Math.max((elapsedDuration / totalDuration) * 100, 0), 100)
    
    // Calculate value progress (%)
    const valueProgress = Math.min(Math.max(((init_value - curr_value) / init_value) * 100, 0), 100)
    
    // Determine value_status by comparing time progress and value progress
    let value_status = 'good'
    
    if (status === 'inactive' || status === 'on_hold') {
        // Contract tidak aktif
        if (curr_value === init_value) {
            value_status = 'good' // belum dipakai
        } else if (curr_value <= 0) {
            value_status = 'minus' // sudah habis
        } else {
            value_status = 'good'
        }
    } else {
        // Contract sedang aktif
        const difference = valueProgress - timeProgress
        
        if (curr_value <= 0) {
            value_status = 'minus' // dana sudah habis
        } else if (difference >= 15) {
            value_status = 'bad' // penggunaan terlalu cepat (berbahaya)
        } else if (difference >= 5) {
            value_status = 'warning' // penggunaan agak cepat (perlu perhatian)
        } else {
            value_status = 'good' // penggunaan normal
        }
    }
    
    return { value_status, timeProgress, valueProgress }
}

// Get all contracts
router.post('/get', authMiddleware, async (req, res) => {
    try {
        const contracts = await Contract.findAll({
            include: [
                {
                    model: User,
                    as: 'creator'
                },
                {
                    model: ContractUsage,
                    as: 'usages'
                }
            ],
            order: [['created_at', 'DESC']]
        })
        
        res.json({
            success: true,
            data: contracts
        })
    } catch (error) {
        console.error('Get contracts error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kontrak',
            error: error.message
        })
    }
})

// Get contract by ID
router.post('/get-by-id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.body
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID kontrak harus diisi'
            })
        }
        
        const contract = await Contract.findOne({
            where: { uid: id },
            include: [
                {
                    model: User,
                    as: 'creator'
                },
                {
                    model: User,
                    as: 'updater'
                },
                {
                    model: ContractUsage,
                    as: 'usages',
                    include: [
                        {
                            model: User,
                            as: 'creator'
                        }
                    ]
                }
            ]
        })
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Kontrak tidak ditemukan'
            })
        }
        
        res.json({
            success: true,
            data: contract
        })
    } catch (error) {
        console.error('Get contract error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data kontrak',
            error: error.message
        })
    }
})

// Create contract
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const {
            no_contract,
            title,
            company,
            start,
            end,
            init_value,
            curr_value,
            status,
            description
        } = req.body
        
        if (!no_contract || !title || !company || !start || !end || !init_value || curr_value === undefined || !status) {
            return res.status(400).json({
                success: false,
                message: 'Data kontrak tidak lengkap'
            })
        }
        
        // Validate status
        if (!['active', 'inactive', 'on_hold'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status tidak valid'
            })
        }
        
        const existingContract = await Contract.findOne({
            where: { no_contract }
        })
        
        if (existingContract) {
            return res.status(400).json({
                success: false,
                message: 'Nomor kontrak sudah digunakan'
            })
        }
        
        // Calculate value_status automatically
        const { value_status } = calculateValueStatus(start, end, init_value, curr_value, status)
        
        const uid = generateUID()
        
        const contract = await Contract.create({
            uid,
            no_contract,
            title,
            company,
            start,
            end,
            init_value,
            curr_value,
            status,
            value_status,
            description: description || '',
            created_by: req.user.uid,
            updated_by: req.user.uid,
            created_at: new Date(),
            updated_at: new Date()
        })
        
        res.status(201).json({
            success: true,
            message: 'Kontrak berhasil dibuat',
            data: contract
        })
    } catch (error) {
        console.error('Create contract error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal membuat kontrak',
            error: error.message
        })
    }
})

// Update contract
router.post('/update', authMiddleware, async (req, res) => {
    try {
        const {
            id,
            no_contract,
            title,
            company,
            start,
            end,
            init_value,
            curr_value,
            status,
            description
        } = req.body
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID kontrak harus diisi'
            })
        }
        
        const contract = await Contract.findOne({
            where: { uid: id },
            include: [
                {
                    model: ContractUsage,
                    as: 'usages'
                }
            ]
        })
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Kontrak tidak ditemukan'
            })
        }
        
        // Check if no_contract is being changed and if it's already used
        if (no_contract && no_contract !== contract.no_contract) {
            const existingContract = await Contract.findOne({
                where: { no_contract }
            })
            
            if (existingContract) {
                return res.status(400).json({
                    success: false,
                    message: 'Nomor kontrak sudah digunakan'
                })
            }
        }
        
        // Validate status if provided
        if (status && !['active', 'inactive', 'on_hold'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status tidak valid'
            })
        }
        
        // Calculate total usage
        const totalUsage = contract.usages.reduce((sum, usage) => sum + parseFloat(usage.value_usage), 0)
        
        // Use updated values or existing values
        const updatedStart = start || contract.start
        const updatedEnd = end || contract.end
        const updatedStatus = status || contract.status

        const newInitValue = parseFloat(init_value)
        const newCurrValue = parseFloat(curr_value)
        
        const initValueChanged = newInitValue !== parseFloat(contract.init_value)
        const currValueChanged = newCurrValue !== parseFloat(contract.curr_value)

        const updatedInitValue = initValueChanged ? newInitValue : contract.init_value

        // Priority:
        // 1. curr_value berubah → pakai langsung (user sengaja ubah)
        // 2. hanya init_value berubah → hitung ulang: init_value - total_usage
        // 3. tidak ada yang berubah → pakai nilai lama
        let updatedCurrValue
        if (currValueChanged) {
            updatedCurrValue = newCurrValue
        } else if (initValueChanged) {
            updatedCurrValue = updatedInitValue - totalUsage
        } else {
            updatedCurrValue = contract.curr_value
        }
        
        // Calculate value_status automatically
        const { value_status } = calculateValueStatus(
            updatedStart, 
            updatedEnd, 
            updatedInitValue, 
            updatedCurrValue,
            updatedStatus
        )
        
        await contract.update({
            no_contract: no_contract || contract.no_contract,
            title: title || contract.title,
            company: company || contract.company,
            start: updatedStart,
            end: updatedEnd,
            init_value: updatedInitValue,
            curr_value: updatedCurrValue, // Calculated automatically
            status: updatedStatus,
            value_status,
            description: description !== undefined ? description : contract.description,
            updated_by: req.user.uid,
            updated_at: new Date()
        })
        
        // Reload contract with updated data
        await contract.reload()
        
        res.json({
            success: true,
            message: 'Kontrak berhasil diperbarui',
            data: contract,
            info: {
                total_usage: totalUsage,
                calculated_curr_value: updatedCurrValue
            }
        })
    } catch (error) {
        console.error('Update contract error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui kontrak',
            error: error.message
        })
    }
})

// Delete contract
router.post('/delete', authMiddleware, async (req, res) => {
    try {
        const { id } = req.body
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID kontrak harus diisi'
            })
        }
        
        const contract = await Contract.findOne({
            where: { uid: id }
        })
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Kontrak tidak ditemukan'
            })
        }
        
        await contract.destroy()
        
        res.json({
            success: true,
            message: 'Kontrak berhasil dihapus'
        })
    } catch (error) {
        console.error('Delete contract error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus kontrak',
            error: error.message
        })
    }
})

// ==================== CONTRACT USAGE ROUTES ====================

// Create contract usage
router.post('/usage/create', authMiddleware, async (req, res) => {
    try {
        const {
            contract_id,
            claim_type,
            claim_start,
            claim_end,
            value_usage,
            description
        } = req.body
        
        // Validation
        if (!contract_id || !claim_type || !claim_start || !claim_end || !value_usage || !description) {
            return res.status(400).json({
                success: false,
                message: 'Data penggunaan kontrak tidak lengkap'
            })
        }
        
        // Validate claim_type
        const validClaimTypes = ['daily', 'weekly', 'two-weekly', 'monthly', 'two-monthly']
        if (!validClaimTypes.includes(claim_type)) {
            return res.status(400).json({
                success: false,
                message: 'Tipe klaim tidak valid'
            })
        }
        
        // Check if contract exists
        const contract = await Contract.findOne({
            where: { uid: contract_id }
        })
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Kontrak tidak ditemukan'
            })
        }
        
        // Create usage record (no validation for sufficient balance)
        const usage = await ContractUsage.create({
            contract_id,
            claim_type,
            claim_start,
            claim_end,
            value_usage,
            description,
            created_by: req.user.uid,
            created_at: new Date()
        })
        
        // Update contract curr_value (allow negative)
        const newCurrValue = contract.curr_value - value_usage
        
        // Recalculate value_status
        const { value_status } = calculateValueStatus(
            contract.start,
            contract.end,
            contract.init_value,
            newCurrValue,
            contract.status
        )
        
        await contract.update({
            curr_value: newCurrValue,
            value_status,
            updated_by: req.user.uid,
            updated_at: new Date()
        })
        
        // Return warning if balance is negative
        const message = newCurrValue < 0 
            ? `Penggunaan kontrak berhasil ditambahkan. Peringatan: Saldo kontrak minus (${newCurrValue})`
            : 'Penggunaan kontrak berhasil ditambahkan'
        
        res.status(201).json({
            success: true,
            message,
            data: usage,
            warning: newCurrValue < 0 ? 'Saldo kontrak telah minus' : null
        })
    } catch (error) {
        console.error('Create contract usage error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan penggunaan kontrak',
            error: error.message
        })
    }
})

// Update contract usage
router.post('/usage/update', authMiddleware, async (req, res) => {
    try {
        const {
            id,
            claim_type,
            claim_start,
            claim_end,
            value_usage,
            description
        } = req.body
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID penggunaan kontrak harus diisi'
            })
        }
        
        // Find usage record
        const usage = await ContractUsage.findByPk(id)
        
        if (!usage) {
            return res.status(404).json({
                success: false,
                message: 'Data penggunaan kontrak tidak ditemukan'
            })
        }
        
        // Find contract
        const contract = await Contract.findOne({
            where: { uid: usage.contract_id }
        })
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Kontrak tidak ditemukan'
            })
        }
        
        // Calculate difference if value_usage is updated
        let valueDifference = 0
        if (value_usage !== undefined && value_usage !== usage.value_usage) {
            valueDifference = usage.value_usage - value_usage
            // No validation for negative balance - allow minus
        }
        
        // Validate claim_type if provided
        if (claim_type) {
            const validClaimTypes = ['daily', 'weekly', 'two-weekly', 'monthly', 'two-monthly']
            if (!validClaimTypes.includes(claim_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipe klaim tidak valid'
                })
            }
        }
        
        // Update usage record
        await usage.update({
            claim_type: claim_type || usage.claim_type,
            claim_start: claim_start || usage.claim_start,
            claim_end: claim_end || usage.claim_end,
            value_usage: value_usage !== undefined ? value_usage : usage.value_usage,
            description: description || usage.description
        })
        
        // Update contract curr_value if value changed (allow negative)
        if (valueDifference !== 0) {
            const newCurrValue = contract.curr_value + valueDifference
            
            // Recalculate value_status
            const { value_status } = calculateValueStatus(
                contract.start,
                contract.end,
                contract.init_value,
                newCurrValue,
                contract.status
            )
            
            await contract.update({
                curr_value: newCurrValue,
                value_status,
                updated_by: req.user.uid,
                updated_at: new Date()
            })
        }
        
        res.json({
            success: true,
            message: 'Penggunaan kontrak berhasil diperbarui',
            data: usage
        })
    } catch (error) {
        console.error('Update contract usage error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui penggunaan kontrak',
            error: error.message
        })
    }
})

// Delete contract usage
router.post('/usage/delete', authMiddleware, async (req, res) => {
    try {
        const { id } = req.body
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID penggunaan kontrak harus diisi'
            })
        }
        
        // Find usage record
        const usage = await ContractUsage.findByPk(id)
        
        if (!usage) {
            return res.status(404).json({
                success: false,
                message: 'Data penggunaan kontrak tidak ditemukan'
            })
        }
        
        // Find contract
        const contract = await Contract.findOne({
            where: { uid: usage.contract_id }
        })
        
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Kontrak tidak ditemukan'
            })
        }
        
        // Restore curr_value (can go positive even if it was negative)
        const newCurrValue = contract.curr_value + usage.value_usage
        
        // Recalculate value_status
        const { value_status } = calculateValueStatus(
            contract.start,
            contract.end,
            contract.init_value,
            newCurrValue,
            contract.status
        )
        
        // Update contract
        await contract.update({
            curr_value: newCurrValue,
            value_status,
            updated_by: req.user.uid,
            updated_at: new Date()
        })
        
        // Delete usage record
        await usage.destroy()
        
        res.json({
            success: true,
            message: 'Penggunaan kontrak berhasil dihapus'
        })
    } catch (error) {
        console.error('Delete contract usage error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus penggunaan kontrak',
            error: error.message
        })
    }
})

// Get usage by contract ID
router.post('/usage/get-by-contract', authMiddleware, async (req, res) => {
    try {
        const { contract_id } = req.body
        
        if (!contract_id) {
            return res.status(400).json({
                success: false,
                message: 'ID kontrak harus diisi'
            })
        }
        
        const usages = await ContractUsage.findAll({
            where: { contract_id },
            order: [['created_at', 'DESC']]
        })
        
        res.json({
            success: true,
            data: usages
        })
    } catch (error) {
        console.error('Get contract usage error:', error)
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data penggunaan kontrak',
            error: error.message
        })
    }
})

export default router