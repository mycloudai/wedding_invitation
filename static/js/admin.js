/* ==========================================================================
   Admin Panel – JavaScript
   - Add guest via API
   - Delete guest
   - Copy URL
   - Toast notifications
   ========================================================================== */

// ---------- Toast ----------
function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------- Copy ----------
function copyUrl() {
    const input = document.getElementById('result-url');
    copyText(input.value);
}

function copyMessage() {
    const textarea = document.getElementById('result-message');
    copyText(textarea.value);
}

function generateInviteMessage(name, url) {
    return '致' + name + '，期待您来参加' +
        WEDDING_CONFIG.groomName + '&' + WEDDING_CONFIG.brideName +
        '的婚礼，这是我们给你准备的专属电子邀请函' +
        '（如果微信QQ无法直接打开，可以复制链接，使用浏览器打开）：' + url;
}

function copyText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('已复制到剪贴板');
    }
}

// ---------- Add Guest ----------
document.getElementById('add-guest-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameInput = document.getElementById('guest-name');
    const ceremonyInput = document.getElementById('guest-ceremony');
    const name = nameInput.value.trim();
    if (!name) return;
    const ceremony = ceremonyInput.checked;

    try {
        const resp = await fetch('/api/guests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, ceremony }),
        });
        const data = await resp.json();

        if (resp.status === 201 || resp.status === 200) {
            // Show result
            const resultArea = document.getElementById('result');
            const resultUrl = document.getElementById('result-url');
            const resultMessage = document.getElementById('result-message');
            resultUrl.value = data.url;
            resultMessage.value = generateInviteMessage(data.name || name, data.url);
            resultArea.style.display = '';

            if (resp.status === 201) {
                showToast('邀请函已生成');
                addGuestToTable(data.code, data.name, data.url, data.ceremony);
            } else {
                // Updated existing guest – refresh the row
                showToast('已更新「' + (data.name || name) + '」的邀请函');
                updateGuestRow(data.code, data.name, data.url, data.ceremony);
            }

            nameInput.value = '';
            ceremonyInput.checked = false;
        } else {
            showToast(data.error || '创建失败');
        }
    } catch (err) {
        showToast('网络错误，请重试');
    }
});

function addGuestToTable(code, name, fullUrl, ceremony) {
    const tbody = document.querySelector('#guest-table tbody');
    const emptyMsg = document.getElementById('empty-msg');
    if (emptyMsg) emptyMsg.style.display = 'none';

    const shortUrl = '/i/' + code;
    const ceremonyBadge = ceremony
        ? '<span class="badge badge-yes">✓ 参加</span>'
        : '<span class="badge badge-no">–</span>';
    const tr = document.createElement('tr');
    tr.setAttribute('data-code', code);
    tr.innerHTML =
        '<td class="td-name">' + escapeHtml(name) + '</td>' +
        '<td class="td-ceremony">' + ceremonyBadge + '</td>' +
        '<td class="td-url"><a href="' + shortUrl + '" target="_blank">' + shortUrl + '</a></td>' +
        '<td class="td-actions">' +
            '<button class="btn btn-sm btn-outline" onclick="copyText(\'' + escapeHtml(fullUrl) + '\')">复制</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteGuest(\'' + code + '\')">删除</button>' +
        '</td>';
    tbody.prepend(tr);

    // Update count
    updateCount(1);
}

// ---------- Delete Guest ----------
async function deleteGuest(code) {
    if (!confirm('确定删除该宾客的邀请函？')) return;

    try {
        const resp = await fetch('/api/guests/' + code, { method: 'DELETE' });
        if (resp.ok) {
            const tr = document.querySelector('tr[data-code="' + code + '"]');
            if (tr) tr.remove();
            updateCount(-1);
            showToast('已删除');
        } else {
            showToast('删除失败');
        }
    } catch (err) {
        showToast('网络错误');
    }
}

// ---------- Helpers ----------
function updateGuestRow(code, name, fullUrl, ceremony) {
    const tr = document.querySelector('tr[data-code="' + code + '"]');
    if (!tr) return;
    const shortUrl = '/i/' + code;
    const ceremonyBadge = ceremony
        ? '<span class="badge badge-yes">✓ 参加</span>'
        : '<span class="badge badge-no">–</span>';
    tr.innerHTML =
        '<td class="td-name">' + escapeHtml(name) + '</td>' +
        '<td class="td-ceremony">' + ceremonyBadge + '</td>' +
        '<td class="td-url"><a href="' + shortUrl + '" target="_blank">' + shortUrl + '</a></td>' +
        '<td class="td-actions">' +
            '<button class="btn btn-sm btn-outline" onclick="copyText(\'' + escapeHtml(fullUrl) + '\')">复制</button>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteGuest(\'' + code + '\')">删除</button>' +
        '</td>';
}

function updateCount(delta) {
    const countEl = document.getElementById('guest-count');
    if (countEl) {
        const current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = current + delta;
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
