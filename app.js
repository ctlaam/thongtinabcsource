// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log('MongoDB connection error:', err));

// Định nghĩa model Customer
const customerSchema = new mongoose.Schema({
    name: String,
    dob: String,
    phone: String,
    date: Date,
    status: String,
    address: String,
    email: String,
    time: Date
}, { collection: 'customers' });

const Customer = mongoose.model('Customer', customerSchema);

// API Routes - Với phân trang
app.get('/api/customers', async (req, res) => {
    try {
        // Lấy tham số phân trang từ query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Mặc định 50 bản ghi
        const skip = (page - 1) * limit;

        // Đếm tổng số bản ghi
        const total = await Customer.countDocuments();

        // Lấy dữ liệu với phân trang
        const customers = await Customer.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: customers.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// API để lấy tất cả dữ liệu (không phân trang)
app.get('/api/customers/all', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ date: -1 });
        res.json({ success: true, count: customers.length, data: customers });
    } catch (error) {
        console.error('Error fetching all customers:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// API kiểm tra số điện thoại trùng lặp
app.get('/api/customers/check-phone', async (req, res) => {
    try {
        const { phone, excludeId } = req.query;

        if (!phone) {
            return res.json({ success: true, message: 'Số điện thoại hợp lệ' });
        }

        // Tìm kiếm khách hàng có số điện thoại trùng khớp chính xác, ngoại trừ ID được chỉ định
        let query = {};
        if (excludeId) {
            query = { _id: { $ne: excludeId }, phone: phone };
        } else {
            query = { phone: phone };
        }

        const duplicateCustomer = await Customer.findOne(query);

        if (duplicateCustomer) {
            return res.json({
                success: false,
                message: 'Số điện thoại đã tồn tại trong hệ thống',
                duplicateCustomer: duplicateCustomer
            });
        }

        return res.json({ success: true, message: 'Số điện thoại hợp lệ' });
    } catch (error) {
        console.error('Error checking phone:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});


// Thêm khách hàng mới
app.post('/api/customers', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại là bắt buộc'
            });
        }
        // Nếu không có trùng lặp, tiếp tục tạo khách hàng mới
        const customer = await Customer.create(req.body);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});




// Tìm kiếm khách hàng với phân trang
app.get('/api/customers/search', async (req, res) => {
    try {
        const term = req.query.term;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        if (!term) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        // Tạo điều kiện tìm kiếm
        const searchCondition = {
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { phone: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } },
                { address: { $regex: term, $options: 'i' } }
            ]
        };

        // Đếm tổng số bản ghi thỏa mãn điều kiện tìm kiếm
        const total = await Customer.countDocuments(searchCondition);

        // Lấy dữ liệu với phân trang
        const customers = await Customer.find(searchCondition)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: customers.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: customers
        });
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật thông tin khách hàng
app.put('/api/customers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại là bắt buộc'
            });
        }

        // Tìm kiếm khách hàng có số điện thoại trùng khớp chính xác (trừ chính bản ghi đang cập nhật)
        const duplicateCustomer = await Customer.findOne({
            _id: { $ne: id },
            phone: phone
        });

        if (duplicateCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại đã tồn tại trong hệ thống',
                duplicateCustomer: duplicateCustomer
            });
        }

        // Nếu không có trùng lặp, tiếp tục cập nhật khách hàng
        const customer = await Customer.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khách hàng'
            });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật thông tin khách hàng
app.put('/api/customers/:id', async (req, res) => {
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
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa khách hàng
app.delete('/api/customers/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});



// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
