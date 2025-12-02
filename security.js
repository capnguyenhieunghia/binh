

(function () {
    'use strict';

    // --- 1. NGĂN CHẶN SAO CHÉP VÀ DEVTOOLS (Làm khó người dùng thông thường) ---

    // Chặn Right-Click (Context Menu)
    document.addEventListener('contextmenu', (e) => {
        // e.preventDefault(); // Hãy cân nhắc việc chặn hoàn toàn
        console.log("Context menu bị chặn.");
    });

    // Chặn F12 và tổ hợp phím mở DevTools
    document.onkeydown = function (e) {
        // Chặn F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Chặn Ctrl/Cmd + Shift + I (Inspect Element)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.keyCode === 73)) {
            e.preventDefault();
            return false;
        }

        // Chặn Ctrl/Cmd + U (View Source Code)
        if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }
    };


    // --- 2. HÀM LÀM SẠCH VÀ CHÈN DỮ LIỆU AN TOÀN (Phòng chống XSS cơ bản) ---

    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- 3. CHỐNG ANTI-DEBUGGING LOOP (Làm đơ trình duyệt nếu DevTools mở) ---

    let devtoolsOpen = false;

    const checkDevTools = () => {
        // Kiểm tra qua kích thước cửa sổ (một trong những cách phổ biến)
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;

        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;

                // Kích hoạt debugger liên tục
                (function loop() {
                    if (devtoolsOpen) {
                        // eslint-disable-next-line no-debugger
                        debugger;
                        setTimeout(loop, 100);
                    }
                })();
            }
        } else {
            devtoolsOpen = false;
        }
    };

    // Thiết lập kiểm tra định kỳ
    window.addEventListener('resize', checkDevTools);
    setInterval(checkDevTools, 1000);
    checkDevTools();

})();