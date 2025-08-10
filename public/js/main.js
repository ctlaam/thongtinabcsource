// public/js/main.js

// Biến toàn cục
let customers = [];
let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;
let isEditing = false;
let searchTerm = '';
let itemsPerPage = 50; // Mặc định 50 bản ghi mỗi trang
let isFormVisible = true;
// Biến toàn cục để kiểm soát trạng thái loading
let isLoading = false;

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo các biến DOM
    initDOMElements();

    // Khởi tạo các event listeners
    initEventListeners();

    // Khởi tạo các plugin
    initPlugins();

    // Tải dữ liệu khách hàng
    fetchCustomers();
});

// Hiển thị loading spinner
function showLoading() {
    if (isLoading) return; // Tránh hiển thị nhiều spinner

    isLoading = true;

    // Kiểm tra xem đã có spinner chưa
    if (!document.querySelector('.spinner-overlay')) {
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.className = 'spinner-overlay';
        spinnerOverlay.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <p class="spinner-text">Đang xử lý...</p>
            </div>
        `;
        document.body.appendChild(spinnerOverlay);

        // Vô hiệu hóa tất cả các nút khi đang loading
        disableAllButtons(true);
    }
}

// Ẩn loading spinner
function hideLoading() {
    const spinnerOverlay = document.querySelector('.spinner-overlay');
    if (spinnerOverlay) {
        isLoading = false;

        // Thêm class fade-out trước khi xóa để có animation
        spinnerOverlay.classList.add('fade-out');

        // Xóa spinner sau khi animation hoàn tất
        setTimeout(() => {
            spinnerOverlay.remove();

            // Kích hoạt lại tất cả các nút
            disableAllButtons(false);
        }, 300);
    }
}

// Vô hiệu hóa/kích hoạt tất cả các nút
function disableAllButtons(disable) {
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    buttons.forEach(button => {
        button.disabled = disable;
    });
}

// Khởi tạo các biến DOM
function initDOMElements() {
    window.customerForm = document.getElementById('customerForm');
    window.customerId = document.getElementById('customerId');
    window.formTitle = document.getElementById('formTitle');
    window.cancelBtn = document.getElementById('cancelBtn');
    window.searchInput = document.getElementById('searchInput');
    window.searchBtn = document.getElementById('searchBtn');
    window.customersList = document.getElementById('customersList');
    window.pagination = document.getElementById('pagination');
    window.currentCountEl = document.getElementById('currentCount');
    window.totalRecordsEl = document.getElementById('totalRecords');
    window.recordsPerPageSelect = document.getElementById('recordsPerPage');
    window.toggleFormBtn = document.getElementById('toggleFormBtn');
    window.formContainer = document.getElementById('formContainer');
    window.sidebarCollapse = document.getElementById('sidebarCollapse');
    window.sidebar = document.getElementById('sidebar');
    window.content = document.getElementById('content');
    // Thêm biến DOM mới
    window.submitBtnText = document.getElementById('submitBtnText');
    // Đặt giá trị mặc định cho nút submit
    if (submitBtnText) {
        submitBtnText.textContent = 'Thêm mới';
    }
}

// Khởi tạo các event listeners
function initEventListeners() {
    // Xử lý submit form
    customerForm.addEventListener('submit', handleFormSubmit);

    // Xử lý nút hủy
    cancelBtn.addEventListener('click', resetForm);

    // Xử lý tìm kiếm
    searchBtn.addEventListener('click', () => {
        searchTerm = searchInput.value.trim();
        currentPage = 1; // Reset về trang đầu tiên khi tìm kiếm
        fetchCustomers();
    });

    // Xử lý tìm kiếm khi nhấn Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchTerm = searchInput.value.trim();
            currentPage = 1;
            fetchCustomers();
            e.preventDefault();
        }
    });

    // Xử lý thay đổi số bản ghi mỗi trang
    recordsPerPageSelect.addEventListener('change', () => {
        itemsPerPage = parseInt(recordsPerPageSelect.value);
        currentPage = 1; // Reset về trang đầu tiên khi thay đổi số bản ghi
        fetchCustomers();
    });

    // Xử lý ẩn/hiện form
    toggleFormBtn.addEventListener('click', () => {
        $(formContainer).slideToggle();
        isFormVisible = !isFormVisible;
        toggleFormBtn.innerHTML = isFormVisible
            ? '<i class="bi bi-chevron-up"></i>'
            : '<i class="bi bi-chevron-down"></i>';
    });

    // Xử lý toggle sidebar
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            content.classList.toggle('active');
        });
    }

    // Xử lý đóng sidebar khi click bên ngoài (trên mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && e.target !== sidebarCollapse) {
                sidebar.classList.remove('active');
                content.classList.add('active');
            }
        }
    });
}

// Khởi tạo các plugin
function initPlugins() {
    // Khởi tạo Flatpickr cho các trường ngày tháng
    flatpickr(".datepicker", {
        dateFormat: "d/m/Y",
        locale: "vn",
        allowInput: true
    });
}

// Hiển thị loading spinner
function showLoading() {
    // Kiểm tra xem đã có spinner chưa
    if (!document.querySelector('.spinner-overlay')) {
        const spinnerOverlay = document.createElement('div');
        spinnerOverlay.className = 'spinner-overlay';
        spinnerOverlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(spinnerOverlay);
    }
}

// Ẩn loading spinner
function hideLoading() {
    const spinnerOverlay = document.querySelector('.spinner-overlay');
    if (spinnerOverlay) {
        spinnerOverlay.remove();
    }
}

// Hàm lấy dữ liệu khách hàng từ API
async function fetchCustomers() {
    showLoading();
    try {
        let url = `/api/customers?page=${currentPage}&limit=${itemsPerPage}`;

        if (searchTerm) {
            url = `/api/customers/search?term=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            customers = data.data;
            totalPages = data.totalPages || 1;
            totalRecords = data.total || 0;

            // Cập nhật thông tin hiển thị
            updatePaginationInfo();
            renderCustomers();
            renderPagination();
        } else {
            showSweetAlert('Lỗi', 'Lỗi khi tải dữ liệu khách hàng', 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showSweetAlert('Lỗi kết nối', 'Không thể kết nối đến máy chủ', 'error');
    } finally {
        hideLoading();
    }
}

// Cập nhật thông tin phân trang
function updatePaginationInfo() {
    currentCountEl.textContent = customers.length;
    totalRecordsEl.textContent = totalRecords;
}

// Hàm hiển thị danh sách khách hàng
function renderCustomers() {
    customersList.innerHTML = '';

    if (customers.length === 0) {
        customersList.innerHTML = '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
        return;
    }

    // Tiếp tục từ phần forEach
    customers.forEach(customer => {
        const statusClass = customer.status === 'ok' || customer.status === 'OK' ? 'status-ok' : 'status-pending';

        const row = document.createElement('tr');
        row.className = 'animate__animated animate__fadeIn';
        row.innerHTML = `
            <td>${customer.name || ''}</td>
            <td>${customer.dob || ''}</td>
            <td>${customer.phone || ''}</td>
            <td>${customer.email || ''}</td>
            <td>${customer.address || ''}</td>
            <td><span class="${statusClass}">${customer.status || ''}</span></td>
            <td>${formatDate(customer.date) || ''}</td>
            <td>${formatTime(customer.time) || ''}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="editCustomer('${customer._id}')" title="Sửa">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteCustomer('${customer._id}')" title="Xóa">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        customersList.appendChild(row);
    });
}

// Hàm tạo phân trang
function renderPagination() {
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    // Nút Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;"><i class="bi bi-chevron-left"></i></a>`;
    pagination.appendChild(prevLi);

    // Hiển thị tối đa 5 trang
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    // Điều chỉnh startPage nếu endPage bị giới hạn
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    // Nút trang đầu tiên
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        firstLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(1); return false;">1</a>`;
        pagination.appendChild(firstLi);

        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<a class="page-link" href="#">...</a>`;
            pagination.appendChild(ellipsisLi);
        }
    }

    // Các trang ở giữa
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        pagination.appendChild(li);
    }

    // Nút trang cuối cùng
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<a class="page-link" href="#">...</a>`;
            pagination.appendChild(ellipsisLi);
        }

        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        lastLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>`;
        pagination.appendChild(lastLi);
    }

    // Nút Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;"><i class="bi bi-chevron-right"></i></a>`;
    pagination.appendChild(nextLi);
}

// Hàm chuyển trang
function changePage(page) {
    if (page < 1 || page > totalPages) {
        return;
    }
    currentPage = page;
    fetchCustomers();

    // Cuộn lên đầu bảng
    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });
}



// Biến để theo dõi trạng thái submit
let isSubmitting = false;


// Xử lý submit form
async function handleFormSubmit(e) {
    e.preventDefault();

    // Ngăn chặn submit nhiều lần
    if (isSubmitting || isLoading) {
        return;
    }

    // Validate form
    if (!validateForm()) {
        return;
    }

    // Đánh dấu đang trong quá trình submit
    isSubmitting = true;

    // Thay đổi nút submit để thể hiện đang xử lý
    const submitBtn = document.querySelector('#customerForm button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Đang xử lý...`;
    submitBtn.disabled = true;

    // Lấy số điện thoại và kiểm tra trùng lặp trước khi submit
    const phone = document.getElementById('phone').value.trim();

    showLoading();

    try {
        // Kiểm tra số điện thoại trùng lặp
        const duplicateCustomer = await checkDuplicatePhone(phone);

        if (duplicateCustomer && !isEditing) {
            hideLoading();
            showDuplicatePhoneAlert(duplicateCustomer);

            // Reset trạng thái nút submit
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            isSubmitting = false;
            return;
        }

        // Lấy ngày giờ hiện tại
        const currentDateTime = new Date();

        const customerData = {
            name: document.getElementById('name').value,
            dob: document.getElementById('dob').value,
            phone: phone,
            email: document.getElementById('email').value,
            status: document.getElementById('status').value,
            address: document.getElementById('address').value,
            date: currentDateTime.toISOString(),
            time: currentDateTime.toISOString()
        };

        let response;

        if (isEditing) {
            // Cập nhật khách hàng
            response = await fetch(`/api/customers/${customerId.value}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });
        } else {
            // Thêm khách hàng mới
            response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customerData)
            });
        }

        const data = await response.json();

        if (data.success) {
            showSweetAlert(
                'Thành công',
                isEditing ? 'Cập nhật thông tin khách hàng thành công!' : 'Thêm khách hàng mới thành công!',
                'success'
            );
            resetForm();
            fetchCustomers();
        } else {
            // Vẫn giữ xử lý lỗi từ server nếu có
            if (data.duplicateCustomer) {
                showDuplicatePhoneAlert(data.duplicateCustomer);
            } else {
                showSweetAlert('Lỗi', data.message || 'Có lỗi xảy ra', 'error');
            }
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showSweetAlert('Lỗi kết nối', 'Không thể kết nối đến máy chủ', 'error');
    } finally {
        hideLoading();

        // Reset trạng thái nút submit
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        isSubmitting = false;
    }
}
// Kiểm tra số điện thoại trùng lặp
async function checkDuplicatePhone(phone) {
    if (!phone) return null;

    showLoading();

    try {
        // Gọi API kiểm tra số điện thoại đầy đủ
        const response = await fetch(`/api/customers/check-phone?phone=${phone}`);
        const data = await response.json();

        if (data.success === false && data.duplicateCustomer) {
            return data.duplicateCustomer;
        }

        return null;
    } catch (error) {
        console.error('Lỗi kiểm tra số điện thoại:', error);
        return null;
    } finally {
        hideLoading();
    }
}

// Hiển thị thông báo khi số điện thoại trùng lặp
function showDuplicatePhoneAlert(duplicateCustomer) {
    Swal.fire({
        title: 'Số điện thoại đã tồn tại',
        html: `
            Số điện thoại này đã tồn tại trong hệ thống với thông tin:<br><br>
            <strong>Tên:</strong> ${duplicateCustomer.name || 'N/A'}<br>
            <strong>Số điện thoại:</strong> ${duplicateCustomer.phone || 'N/A'}<br>
            <strong>Ngày tạo:</strong> ${formatDate(duplicateCustomer.date) || 'N/A'}<br><br>
        `,
        icon: 'warning',
        showConfirmButton: false, // Ẩn nút xác nhận (OK)
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'Đóng'
    }).then((result) => {
        if (result.isConfirmed) {
            // Tìm và hiển thị bản ghi trùng lặp
            findAndHighlightCustomer(duplicateCustomer._id);
        }
    });
}

// Tìm và làm nổi bật bản ghi trùng lặp
async function findAndHighlightCustomer(customerId) {
    try {
        // Tìm kiếm bản ghi theo ID
        const response = await fetch(`/api/customers/${customerId}`);
        const data = await response.json();

        if (data.success) {
            // Tìm bản ghi trong danh sách hiện tại
            const existingIndex = customers.findIndex(c => c._id === customerId);

            if (existingIndex >= 0) {
                // Nếu bản ghi đã có trong trang hiện tại
                highlightCustomerRow(existingIndex);
            } else {
                // Nếu bản ghi không có trong trang hiện tại, tải lại dữ liệu và tìm kiếm
                await fetchCustomers();

                // Tìm lại sau khi tải dữ liệu
                const newIndex = customers.findIndex(c => c._id === customerId);
                if (newIndex >= 0) {
                    highlightCustomerRow(newIndex);
                } else {
                    // Nếu vẫn không tìm thấy, chuyển sang chế độ tìm kiếm
                    searchInput.value = data.data.phone;
                    searchTerm = data.data.phone;
                    currentPage = 1;
                    await fetchCustomers();

                    // Tìm lại một lần nữa
                    const finalIndex = customers.findIndex(c => c._id === customerId);
                    if (finalIndex >= 0) {
                        highlightCustomerRow(finalIndex);
                    } else {
                        showSweetAlert('Thông báo', 'Không thể tìm thấy bản ghi trong danh sách hiện tại', 'info');
                    }
                }
            }
        } else {
            showSweetAlert('Lỗi', 'Không thể tìm thấy thông tin khách hàng', 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showSweetAlert('Lỗi kết nối', 'Không thể kết nối đến máy chủ', 'error');
    }
}

// Làm nổi bật hàng trong bảng
function highlightCustomerRow(index) {
    // Cuộn đến bảng
    document.querySelector('.table-responsive').scrollIntoView({ behavior: 'smooth' });

    // Lấy tất cả các hàng trong bảng
    const rows = document.querySelectorAll('#customersList tr');

    if (rows[index]) {
        // Thêm class để làm nổi bật
        rows[index].classList.add('highlight-row');

        // Thêm animation để làm nổi bật
        rows[index].classList.add('animate__animated', 'animate__flash');

        // Xóa class sau 3 giây
        setTimeout(() => {
            rows[index].classList.remove('highlight-row', 'animate__animated', 'animate__flash');
        }, 3000);
    }
}



// Validate form
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();

    if (!name) {
        showSweetAlert('Lỗi', 'Vui lòng nhập tên khách hàng', 'warning');
        return false;
    }

    if (!phone) {
        showSweetAlert('Lỗi', 'Vui lòng nhập số điện thoại', 'warning');
        return false;
    }

    return true;
}

// Chỉnh sửa khách hàng
async function editCustomer(id) {
    if (isLoading) return; // Ngăn chặn khi đang loading

    showLoading();
    try {
        const response = await fetch(`/api/customers/${id}`);
        const data = await response.json();

        if (data.success) {
            const customer = data.data;

            // Lưu ID và số điện thoại gốc để so sánh sau này
            window.originalCustomerId = customer._id;
            window.originalPhone = customer.phone || '';

            // Điền thông tin vào form
            customerId.value = customer._id;
            document.getElementById('name').value = customer.name || '';
            document.getElementById('dob').value = customer.dob || '';
            document.getElementById('phone').value = customer.phone || '';
            document.getElementById('email').value = customer.email || '';
            document.getElementById('status').value = customer.status || '';
            document.getElementById('address').value = customer.address || '';

            // Xử lý ngày tháng an toàn
            const dateInput = document.getElementById('date');
            if (dateInput) {
                const currentDate = new Date();
                dateInput.value = formatDateTime(currentDate);
            }

            // Cập nhật trạng thái form
            formTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Cập Nhật Khách Hàng';
            if (submitBtnText) {
                submitBtnText.textContent = 'Sửa';
            }
            cancelBtn.style.display = 'inline-block';
            isEditing = true;

            // Đảm bảo form đang hiển thị
            if (!isFormVisible && formContainer) {
                $(formContainer).slideDown();
                isFormVisible = true;
                if (toggleFormBtn) {
                    toggleFormBtn.innerHTML = '<i class="bi bi-chevron-up"></i>';
                }
            }

            // Cuộn lên đầu trang
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Thêm sự kiện để kiểm tra số điện thoại khi người dùng thay đổi
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                // Xóa event listener cũ (nếu có) để tránh duplicate
                phoneInput.removeEventListener('blur', phoneBlurHandler);
                // Thêm event listener mới
                phoneInput.addEventListener('blur', phoneBlurHandler);
            }
        } else {
            showSweetAlert('Lỗi', data.message || 'Không tìm thấy thông tin khách hàng', 'warning');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showSweetAlert('Lỗi kết nối', 'Không thể kết nối đến máy chủ', 'error');
    } finally {
        hideLoading();
    }
}

// Hàm xử lý sự kiện blur cho trường số điện thoại
async function phoneBlurHandler() {
    const phone = this.value.trim();
    const originalPhone = window.originalPhone || '';

    // Nếu số điện thoại không thay đổi, không cần kiểm tra
    if (isEditing && phone === originalPhone) {
        return;
    }

    if (phone) { // Kiểm tra bất kỳ số điện thoại nào, không quan tâm độ dài
        const duplicateCustomer = await checkDuplicatePhoneExceptCurrent(phone);
        if (duplicateCustomer) {
            showDuplicatePhoneAlert(duplicateCustomer);
            // Có thể reset lại số điện thoại về giá trị ban đầu
            // this.value = originalPhone;
        }
    }
}

// Kiểm tra số điện thoại trùng lặp, ngoại trừ khách hàng hiện tại
async function checkDuplicatePhoneExceptCurrent(phone) {
    if (!phone) return null;

    showLoading();

    try {
        // Lấy ID của khách hàng hiện tại (nếu đang chỉnh sửa)
        const currentId = isEditing ? window.originalCustomerId || '' : '';

        // Gọi API kiểm tra số điện thoại đầy đủ, truyền thêm ID hiện tại để loại trừ
        const response = await fetch(`/api/customers/check-phone?phone=${phone}&excludeId=${currentId}`);
        const data = await response.json();

        if (data.success === false && data.duplicateCustomer) {
            return data.duplicateCustomer;
        }

        return null;
    } catch (error) {
        console.error('Lỗi kiểm tra số điện thoại:', error);
        return null;
    } finally {
        hideLoading();
    }
}

// Xóa khách hàng
function deleteCustomer(id) {
    if (isLoading) return; // Ngăn chặn khi đang loading

    Swal.fire({
        title: 'Xác nhận xóa',
        text: 'Bạn có chắc chắn muốn xóa khách hàng này không?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            performDelete(id);
        }
    });
}

// Thực hiện xóa khách hàng
async function performDelete(id) {
    showLoading();
    try {
        const response = await fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showSweetAlert('Thành công', 'Xóa khách hàng thành công!', 'success');
            fetchCustomers();
        } else {
            showSweetAlert('Lỗi', data.message || 'Có lỗi xảy ra khi xóa khách hàng', 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showSweetAlert('Lỗi kết nối', 'Không thể kết nối đến máy chủ', 'error');
    } finally {
        hideLoading();
    }
}


// Reset form
function resetForm() {
    customerForm.reset();
    customerId.value = '';
    formTitle.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Thêm Khách Hàng Mới';
    submitBtnText.textContent = 'Thêm mới'; // Reset nút submit
    cancelBtn.style.display = 'none';
    isEditing = false;

    // Reset flatpickr
    const datePickers = document.querySelectorAll('.datepicker');
    datePickers.forEach(picker => {
        if (picker._flatpickr) {
            picker._flatpickr.clear();
        }
    });
}

// Hiển thị thông báo SweetAlert
function showSweetAlert(title, message, icon) {
    Swal.fire({
        title: title,
        text: message,
        icon: icon,
        confirmButtonColor: '#4e73df',
        confirmButtonText: 'OK'
    });
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('vi-VN');
}

// Hàm định dạng ngày tháng cho input
function formatDateForInput(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// Hàm định dạng thời gian
function formatTime(timeString) {
    if (!timeString) return '';

    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;

    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Hàm để xuất dữ liệu ra Excel
function exportToExcel() {
    showLoading();

    fetch('/api/customers/all')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                const workbook = XLSX.utils.book_new();

                // Chuẩn bị dữ liệu
                const exportData = data.data.map(customer => ({
                    'Tên': customer.name || '',
                    'Ngày sinh': customer.dob || '',
                    'Số điện thoại': customer.phone || '',
                    'Email': customer.email || '',
                    'Địa chỉ': customer.address || '',
                    'Trạng thái': customer.status || '',
                    'Ngày': formatDate(customer.date) || '',
                    'Thời gian': formatTime(customer.time) || ''
                }));

                const worksheet = XLSX.utils.json_to_sheet(exportData);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách Hàng');

                // Tạo file Excel và tải xuống
                XLSX.writeFile(workbook, 'danh_sach_khach_hang.xlsx');

                showSweetAlert('Thành công', 'Xuất dữ liệu thành công!', 'success');
            } else {
                showSweetAlert('Lỗi', 'Không có dữ liệu để xuất', 'warning');
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
            showSweetAlert('Lỗi', 'Không thể xuất dữ liệu', 'error');
        })
        .finally(() => {
            hideLoading();
        });
}

// Khởi tạo các hàm toàn cục để sử dụng trong HTML
window.changePage = changePage;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;
window.exportToExcel = exportToExcel;
