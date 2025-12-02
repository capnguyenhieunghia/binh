// Địa chỉ xuất CSV công khai của Google Sheet của bạn
        const SHEET_ID = '13pOFFEkgsjgguUq4GTepVIF3DPYozchJIBfQ1ByhU-o';
        const GID = '0'; // Thường là 0 cho sheet đầu tiên
        // URL này chỉ hoạt động nếu Sheet đã được chia sẻ công khai ("Bất kỳ ai có đường liên kết đều có thể xem")
        const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

        let latestProducts = []; // Biến toàn cục để lưu trữ dữ liệu sản phẩm (Đã lọc)
        let allProducts = []; // Biến toàn cục để lưu trữ TẤT CẢ dữ liệu sản phẩm (Gốc)

        // Hàm Tải và Phân tích Dữ liệu từ Google Sheet (CSV)
        async function fetchAndRenderProducts() {
            const productListEl = document.getElementById('product-list');
            const dataStatusEl = document.getElementById('data-status');
            const isDetailsPage = document.getElementById('search-input') !== null; // Kiểm tra nếu là trang chi tiết

            // Hiển thị trạng thái tải
            dataStatusEl.textContent = 'Đang tải dữ liệu sản phẩm';
            productListEl.innerHTML = '';

            try {
                const response = await fetch(CSV_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const csvText = await response.text();
                // Phân tích CSV
                const rows = csvText.trim().split('\n');
                if (rows.length <= 1) {
                    dataStatusEl.textContent = 'Không tìm thấy dữ liệu sản phẩm.';
                    dataStatusEl.classList.replace('text-blue-600', 'text-red-500');
                    return;
                }

                const headers = rows[0].split(',').map(h => h.trim());
                const products = [];

                // Lặp qua các hàng, bỏ qua hàng tiêu đề
                for (let i = 1; i < rows.length; i++) {
                    const values = rows[i].split(',').map(v => v.trim());
                    const product = {};
                    if (values.length >= 4) {
                        product.name = values[0]; // Tên Sản Phẩm
                        product.description = values[1]; // Mô Tả

                        // **CHUYỂN SANG SỐ** và lưu vào biến price
                        product.price = Number(values[2].replace(/\./g, ''));
                        product.imageUrl = values[3]; // URL Ảnh

                        // Kiểm tra xem có cột giảm giá (cột thứ 5) hay không
                        if (values.length >= 5 && values[4].trim() !== '') {
                            // **CHUYỂN SANG SỐ** và lưu vào biến giamgia
                            product.giamgia = Number(values[4].replace('%', '').replace(',', '.'));
                        } else {
                            product.giamgia = 0; // Mặc định là 0% nếu không có hoặc rỗng
                        }
                        product.phanloai = values[5] ? values[5].trim() : 'Khác'; // Phân loại sản phẩm
                        product.masp = values[6] ? values[6].trim() : `SP${i}`; // Mã sản phẩm
                        products.push(product);
                    }
                }
                
                allProducts = products; // Lưu trữ TẤT CẢ sản phẩm gốc
                latestProducts = products; // Ban đầu, latestProducts = allProducts

                // Hiển thị dữ liệu lên giao diện
                renderProductCards(latestProducts, productListEl, dataStatusEl);
                
                // Nếu là trang chi tiết, gắn sự kiện tìm kiếm
                if(isDetailsPage) {
                    document.getElementById('search-input').addEventListener('input', filterProducts);
                }

            } catch (error) {
                console.error('Lỗi khi tải dữ liệu ', error);
                dataStatusEl.textContent = 'LỖI: Không thể tải dữ liệu';
                dataStatusEl.classList.replace('text-blue-600', 'text-red-500');
            }
        }

        // HÀM MỚI: Lọc Sản phẩm
        function filterProducts() {
            const productListEl = document.getElementById('product-list');
            const dataStatusEl = document.getElementById('data-status');
            const searchInput = document.getElementById('search-input');
            const searchTerm = searchInput.value.toLowerCase().trim();

            const filtered = allProducts.filter(product => {
                // Lọc theo tên sản phẩm hoặc phân loại sản phẩm
                return product.name.toLowerCase().includes(searchTerm) || 
                       product.phanloai.toLowerCase().includes(searchTerm);
            });

            latestProducts = filtered; // Cập nhật danh sách đã lọc

            renderProductCards(filtered, productListEl, dataStatusEl);

            // Cập nhật trạng thái cho trang chi tiết
            if (filtered.length === 0) {
                dataStatusEl.textContent = `Không tìm thấy sản phẩm nào phù hợp với từ khóa: "${searchInput.value}"`;
                dataStatusEl.classList.replace('text-green-600', 'text-red-500');
            } else {
                dataStatusEl.textContent = `Tìm thấy ${filtered.length} sản phẩm`;
                dataStatusEl.classList.replace('text-red-500', 'text-green-600');
            }
        }

        // HÀM MỚI: Tách phần hiển thị (để tái sử dụng cho tải và lọc)
        function renderProductCards(products, listElement, statusElement) {
            listElement.innerHTML = ''; // Xóa nội dung cũ

            if (products.length === 0 && allProducts.length > 0) {
                 // Nếu không tìm thấy gì nhưng đã có dữ liệu gốc
                 statusElement.classList.replace('text-blue-600', 'text-red-500');
                 // Hàm filterProducts sẽ tự cập nhật thông báo
            } else if (products.length > 0) {
                products.forEach(product => {
                    const productCard = createProductCard(product);
                    listElement.appendChild(productCard);
                });
                statusElement.textContent = `Đã tải thành công ${products.length} sản phẩm`;
                statusElement.classList.replace('text-red-500', 'text-green-600');
            }
        }

        // Hàm tạo thẻ sản phẩm HTML (Không thay đổi, giữ nguyên)
        function createProductCard(product) {
            const card = document.createElement('div');
            card.classList.add('bg-white', 'rounded-2xl', 'shadow-lg', 'overflow-hidden', 'group');

            // 💡 BƯỚC 1: TÍNH TOÁN GIÁ CUỐI CÙNG
            const originalPrice = product.price; // Giá gốc (số)
            const discountPercentage = product.giamgia; // Phần trăm giảm (số)

            const discountRate = discountPercentage / 100;
            const finalPriceValue = originalPrice * (1 - discountRate);

            // 💡 BƯỚC 2: ĐỊNH DẠNG GIÁ
            // Hàm định dạng giá (thêm dấu chấm và VNĐ)
            const formatCurrency = (price) => {
                // Làm tròn và thêm dấu chấm phân cách hàng nghìn
                return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' VNĐ';
            };

            const formattedFinalPrice = formatCurrency(finalPriceValue);
            const formattedOriginalPrice = formatCurrency(originalPrice);

            // 💡 BƯỚC 3: TẠO CHUỖI HTML PHÙ HỢP
            let priceDisplay;

            if (discountPercentage > 0) {
                // Có giảm giá: Hiển thị giá đã giảm (lớn) và giá gốc (nhỏ, gạch ngang)
                priceDisplay = `
            <span class="text-xl font-bold text-red-600">${formattedFinalPrice}</span>
            <span class="text-sm text-gray-500 line-through ml-2">${formattedOriginalPrice}</span>
            <div class="text-sm font-semibold text-green-500">Giảm ${discountPercentage}%</div>
        `;
            } else {
                // Không giảm giá: Chỉ hiển thị giá gốc
                priceDisplay = `
            <span class="text-xl font-bold text-green-600">${formattedOriginalPrice}</span>
            <div class="text-sm text-gray-500 h-5"></div> `;
            }

            // 💡 BƯỚC 4: THAY THẾ HTML CŨ BẰNG CÁI MỚI
            card.innerHTML = `<div class="sp">
        <img src="${product.imageUrl}" 
             alt="${product.name}" 
             class="w-full h-48 object-cover transition duration-500 group-hover:scale-105"
             onerror="this.onerror=null;this.src='https://placehold.co/600x400/34d399/ffffff?text=${encodeURIComponent(product.name)}';"
        >
        <div class="p-5">
            <h3 class="text-xl font-semibold text-gray-900 mb-2">${product.name}</h3>
            <p class="text-gray-600 text-sm mb-4 truncate">${product.description}</p>
            <div class="price">${priceDisplay}</div> </div>
            <div class="p-5">
                <p class="text-gray-600 text-sm" id="pl">${product.phanloai} | ${product.masp}</p>
            </div>
            </div>
    `;
            return card;
        }

        document.addEventListener('DOMContentLoaded', () => {
            // Tải dữ liệu sản phẩm ngay khi trang tải xong
            fetchAndRenderProducts();

            // 1. Logic cho Mobile Menu
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            
            // Chỉ chạy logic này nếu các phần tử tồn tại (trên index.html)
            if (mobileMenuButton && mobileMenu) {
                mobileMenuButton.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });

                // Tự đóng menu khi click vào link trên mobile
                mobileMenu.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        mobileMenu.classList.add('hidden');
                    });
                });
            }


            // 2. Logic cho Smooth Scrolling
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });

            // 3. Logic cho Form Liên hệ (Simple validation & message display)
            const contactForm = document.getElementById('contact-form');
            const formMessage = document.getElementById('form-message');
            const phoneInput = document.getElementById('phone');
            const phoneError = document.getElementById('phone-error');
            
            // Chỉ chạy logic này nếu các phần tử tồn tại (trên index.html)
            if (contactForm && phoneInput) {
                contactForm.addEventListener('submit', function (e) {
                    e.preventDefault();

                    let isValid = true;
                    const phoneValue = phoneInput.value.trim();

                    // Simple phone number validation (at least 8 digits, only numbers/spaces/dashes)
                    const phoneRegex = /^[0-9\s-]{8,}$/;
                    if (!phoneRegex.test(phoneValue)) {
                        phoneError.classList.remove('hidden');
                        phoneInput.classList.add('border-red-500');
                        isValid = false;
                    } else {
                        phoneError.classList.add('hidden');
                        phoneInput.classList.remove('border-red-500');
                    }

                    if (isValid) {
                        // Đây là nơi bạn sẽ gửi dữ liệu đến server thực tế.
                        // Hiện tại, chúng ta chỉ mô phỏng việc gửi thành công.
                        console.log('Dữ liệu form được gửi:', {
                            name: document.getElementById('name').value,
                            phone: phoneValue,
                            message: document.getElementById('message').value
                        });

                        // Hiển thị thông báo thành công
                        formMessage.textContent = 'Cảm ơn bạn! Đơn hàng/yêu cầu của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ lại sớm nhất!';
                        formMessage.classList.remove('hidden', 'text-red-500');
                        formMessage.classList.add('text-green-600');

                        // Reset form sau 5 giây
                        setTimeout(() => {
                            contactForm.reset();
                            formMessage.classList.add('hidden');
                        }, 5000);
                    } else {
                        formMessage.textContent = 'Vui lòng kiểm tra lại thông tin, đặc biệt là số điện thoại.';
                        formMessage.classList.remove('hidden', 'text-green-600');
                        formMessage.classList.add('text-red-500');
                    }
                });
            }


            // 4. Logic cho FAQ (Accordion functionality)
            const faqItems = document.querySelectorAll('.faq-item');
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question');
                question.addEventListener('click', () => {
                    // Đóng tất cả các item khác
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                        }
                    });

                    // Bật/Tắt item hiện tại
                    item.classList.toggle('active');
                });
            });

            // 5. Logic cho Countdown Timer (3 phút)
            const minutesEl = document.getElementById('minutes');
            // Chỉ chạy logic này nếu các phần tử tồn tại (trên index.html)
            if (minutesEl) {
                const startingMinutes = 3;
                let time = startingMinutes * 60; // 180 seconds

                
                const secondsEl = document.getElementById('seconds');

                function updateCountdown() {
                    const minutes = Math.floor(time / 60);
                    let seconds = time % 60;

                    seconds = seconds < 10 ? '0' + seconds : seconds;

                    minutesEl.textContent = minutes < 10 ? '0' + minutes : minutes;
                    secondsEl.textContent = seconds;

                    if (time > 0) {
                        time--;
                    } else {
                        clearInterval(countdownInterval);
                        minutesEl.textContent = '00';
                        secondsEl.textContent = '00';
                    }
                }

                const countdownInterval = setInterval(updateCountdown, 1000);
                updateCountdown(); // Gọi lần đầu để hiển thị ngay
            }

            // ----------------------------------------------------
            // 6. LOGIC CHO CHATBOT KỊCH BẢN (SCRIPTED CHATBOT)
            // ----------------------------------------------------

            const chatToggle = document.getElementById('chat-toggle-button');
            const chatWindow = document.getElementById('chat-window');
            const chatBody = document.getElementById('chat-body');
            const chatIconOpen = document.getElementById('chat-icon-open');
            const chatIconClose = document.getElementById('chat-icon-close');

            if (chatToggle) {
                window.toggleChat = function () {
                    const isActive = chatWindow.classList.toggle('active');
                    if (isActive) {
                        chatWindow.classList.remove('hidden');
                        chatIconOpen.classList.add('hidden');
                        chatIconClose.classList.remove('hidden');
                        // Chỉ gửi lời chào ban đầu nếu chatBody trống
                        if (chatBody.children.length === 0) {
                            sendBotMessage("Chào mừng đến với Bình! Tôi có thể giúp gì cho bạn hôm nay?", true);
                        }
                    } else {
                        // Dùng setTimeout để đảm bảo hiệu ứng transform hoàn thành trước khi ẩn
                        setTimeout(() => {
                            chatWindow.classList.add('hidden');
                        }, 300);
                        chatIconOpen.classList.remove('hidden');
                        chatIconClose.classList.add('hidden');
                    }
                }

                chatToggle.addEventListener('click', window.toggleChat);

                function addMessage(text, isBot) {
                    const messageDiv = document.createElement('div');
                    messageDiv.classList.add('chat-message');

                    if (isBot) {
                        messageDiv.classList.add('bot-message', 'self-start');
                    }
                    // Thêm độ trễ nhỏ để tạo hiệu ứng gõ
                    setTimeout(() => {
                        messageDiv.textContent = text;
                        chatBody.appendChild(messageDiv);
                        // Cuộn xuống tin nhắn mới nhất
                        chatBody.scrollTop = chatBody.scrollHeight;
                    }, isBot ? 500 : 0);
                }

                function sendBotMessage(text, showMenu = false) {
                    // Xóa các tùy chọn cũ nếu có
                    const oldOptions = chatBody.querySelector('.user-options');
                    if (oldOptions) {
                        oldOptions.remove();
                    }

                    addMessage(text, true);

                    if (showMenu) {
                        setTimeout(showInitialOptions, 1000); // Hiển thị menu sau khi bot nói
                    }
                }

                function showInitialOptions() {
                    const optionsDiv = document.createElement('div');
                    optionsDiv.classList.add('user-options', 'flex', 'flex-col', 'mt-3', 'w-full');

                    const options = [
                        { key: 'SP1', text: 'Sản phẩm mới nhất' },
                        { key: 'CS', text: 'Chính sách giao hàng & đổi trả' },
                        { key: 'GQ', text: 'Tư vấn giỏ quà biếu' },
                        { key: 'NV', text: 'Nói chuyện với nhân viên' },
                        { key: 'goi', text: 'Liên hệ người bán' }
                    ];

                    options.forEach(option => {
                        const button = document.createElement('button');
                        button.textContent = option.text;
                        button.classList.add('secondary');
                        button.onclick = () => handleUserSelection(option.key, option.text);
                        optionsDiv.appendChild(button);
                    });

                    chatBody.appendChild(optionsDiv);
                    chatBody.scrollTop = chatBody.scrollHeight;
                }

                function handleUserSelection(key, userText) {
                    // Xóa các tùy chọn sau khi người dùng chọn
                    const oldOptions = chatBody.querySelector('.user-options');
                    if (oldOptions) {
                        oldOptions.remove();
                    }

                    addMessage(userText, false);

                    // Logic kịch bản
                    switch (key) {
                        case 'SP1':
                            // Lấy 3 sản phẩm mới nhất (giả định là 3 sản phẩm đầu tiên)
                            const topProducts = allProducts.slice(0, 3); // Dùng allProducts (gốc)
                            let productMessage = "Hiện tại, ";
                            if (topProducts.length > 0) {
                                productMessage += topProducts.map(p => p.name).join(', ') + " và nhiều loại khác đang có sẵn. ";
                                productMessage += "Bạn có thể xem chi tiết menu đầy đủ tại trang Sản Phẩm bên trên.";
                            } else {
                                productMessage = "Tôi đang gặp khó khăn khi tải danh sách sản phẩm. Vui lòng kiểm tra lại trang Sản Phẩm hoặc thử lại sau.";
                            }

                            sendBotMessage(productMessage, false);
                            setTimeout(() => {
                                const ctaDiv = createCTAButton("Xem Toàn Bộ Sản Phẩm", "#san-pham", false);
                                chatBody.appendChild(ctaDiv);
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }, 1000);
                            setTimeout(() => sendBotMessage("Bạn còn cần hỗ trợ gì khác không?", true), 2000);
                            break;

                        case 'CS':
                            sendBotMessage("Chúng tôi cam kết giao hàng siêu tốc 2 giờ tại nội thành TP.HCM và Hà Nội. Đặc biệt, Bình áp dụng chính sách **1 Đổi 1** nếu sản phẩm bị dập, hư hỏng. Bạn có thể xem thêm thông tin chi tiết:", false);
                            setTimeout(() => {
                                const ctaDiv = createCTAButton("Xem Chính sách 1 Đổi 1", "#chat-luong", false);
                                chatBody.appendChild(ctaDiv);
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }, 1000);
                            setTimeout(() => sendBotMessage("Bạn còn cần hỗ trợ gì khác không?", true), 2000);
                            break;

                        case 'GQ':
                            sendBotMessage("Các giỏ quà của Bình rất được ưa chuộng cho dịp lễ Tết! Chúng tôi thiết kế theo yêu cầu và ngân sách của bạn (từ 500k đến 5 triệu). Vui lòng điền Form ở cuối trang để đội ngũ chuyên viên tư vấn chi tiết hơn.", false);
                            setTimeout(() => {
                                const ctaDiv = createCTAButton("Điền Form Tư Vấn Quà Biếu", "#lien-he", true);
                                chatBody.appendChild(ctaDiv);
                                chatBody.scrollTop = chatBody.scrollHeight;
                            }, 1000);
                            setTimeout(() => sendBotMessage("Bạn còn cần hỗ trợ gì khác không?", true), 2000);
                            break;

                        case 'NV':
                            sendBotMessage("Chúng tôi đã ghi nhận yêu cầu nói chuyện trực tiếp của bạn. Vui lòng điền SĐT và Họ tên vào Form Liên hệ phía dưới. Nhân viên sẽ gọi lại cho bạn trong vòng 10 phút. Cảm ơn bạn!", false);
                            setTimeout(window.toggleChat, 3000); // Tự động đóng chat sau khi chuyển hướng
                            break;

                        default:
                            // Trả về menu chính nếu có lỗi xảy ra
                            sendBotMessage("Xin lỗi, tôi chưa hiểu yêu cầu. Vui lòng chọn lại từ Menu chính.", true);
                            break;
                    }
                }

                function createCTAButton(text, href, closeChat) {
                    const ctaDiv = document.createElement('div');
                    ctaDiv.classList.add('flex', 'flex-col', 'items-start', 'mt-3', 'w-full');

                    const ctaLink = document.createElement('a');
                    ctaLink.textContent = text;
                    ctaLink.href = href;
                    ctaLink.classList.add('cta-button', 'px-4', 'py-2', 'rounded-full', 'text-sm', 'text-white', 'font-semibold', 'shadow-md');

                    ctaLink.onclick = (e) => {
                        e.preventDefault();
                        document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
                        if (closeChat) {
                            window.toggleChat(); // Tự động đóng chat
                        }
                    };

                    ctaDiv.appendChild(ctaLink);
                    return ctaDiv;
                }

                // Bắt đầu bằng cách ẩn chat window và hiển thị nút toggle
                chatWindow.classList.add('hidden');
            }
        });