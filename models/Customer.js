const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên'],
        trim: true
    },
    dob: {
        type: Date
    },
    phone: {
        type: String,
        required: [true, 'Vui lòng nhập số điện thoại']
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Vui lòng nhập địa chỉ email hợp lệ'
        ]
    },
    address: {
        type: String
    },
    status: {
        type: String,
        enum: ['ok', 'đã gọi', 'chờ xử lý'],
        default: 'chờ xử lý'
    },
    date: {
        type: Date,
        default: Date.now
    },
    time: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Customer', 'customers');
