// public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    // Nếu đã có token thì vào thẳng trang chính
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
        return;
    }

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok && data.success && data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = '/';
            } else {
                Swal.fire('Thất bại', data.message || 'Sai tài khoản hoặc mật khẩu', 'error');
            }
        } catch (err) {
            Swal.fire('Lỗi', 'Không thể kết nối máy chủ', 'error');
        }
    });
});
