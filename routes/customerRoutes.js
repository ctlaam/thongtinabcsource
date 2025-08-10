const express = require('express');
const router = express.Router();
const Customer = mongoose.model('Customer');

// Lấy tất cả khách hàng
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ date: -1 });
        res.json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Thêm khách hàng mới
router.post('/', async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Lấy thông tin một khách hàng
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật thông tin khách hàng
router.put('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa khách hàng
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Tìm kiếm khách hàng
router.get('/search', async (req, res) => {
    try {
        const term = req.query.term;

        if (!term) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        const customers = await Customer.find({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { phone: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } },
                { address: { $regex: term, $options: 'i' } }
            ]
        }).sort({ date: -1 });

        res.json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;
