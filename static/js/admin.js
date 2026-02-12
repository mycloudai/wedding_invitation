/* ==========================================================================
   Admin Panel – JavaScript
   - Add guest via API
   - Delete guest
   - Copy URL
   - Toast notifications
   - RSVP Statistics
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
    return '致' + name + '，\n\n' +
        '诚挚邀请您参加' + WEDDING_CONFIG.groomName + ' & ' + WEDDING_CONFIG.brideName + '的婚礼！\n\n' +
        '这是为您准备的专属电子邀请函：\n' +
        url + '\n\n' +
        '❗️ 请在邀请函最后部份填写您是否出席以及出席人数，\n' +
        '以便我们更好地安排婚礼事宜。❗️\n\n' +
        '温馨提示：\n' +
        '如果微信/QQ无法直接打开，请复制链接使用浏览器打开。';
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
        '<td class="td-rsvp"><span class="badge badge-pending">未回复</span></td>' +
        '<td class="td-count"><span class="guest-count-none">-</span></td>' +
        '<td class="td-actions">' +
            '<a href="' + shortUrl + '" target="_blank" class="btn btn-sm btn-primary">打开邀请函</a>' +
            '<button class="btn btn-sm btn-outline" onclick="copyText(\'' + escapeHtml(fullUrl) + '\')">复制链接</button>' +
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

    // Keep existing RSVP status if available
    const rsvpCell = tr.querySelector('.td-rsvp');
    const rsvpHtml = rsvpCell ? rsvpCell.innerHTML : '<span class="badge badge-pending">未回复</span>';
    const countCell = tr.querySelector('.td-count');
    const countHtml = countCell ? countCell.innerHTML : '<span class="guest-count-none">-</span>';

    tr.innerHTML =
        '<td class="td-name">' + escapeHtml(name) + '</td>' +
        '<td class="td-ceremony">' + ceremonyBadge + '</td>' +
        '<td class="td-rsvp">' + rsvpHtml + '</td>' +
        '<td class="td-count">' + countHtml + '</td>' +
        '<td class="td-actions">' +
            '<a href="' + shortUrl + '" target="_blank" class="btn btn-sm btn-primary">打开邀请函</a>' +
            '<button class="btn btn-sm btn-outline" onclick="copyText(\'' + escapeHtml(fullUrl) + '\')">复制链接</button>' +
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

// ---------- RSVP Statistics ----------
const GUESTS_DATA = {{ guests | tojson }};

function calculateStats() {
    let replied = 0;
    let attending = 0;
    let notAttending = 0;
    let pending = 0;
    let ceremonyCount = 0;
    let ceremonyAttending = 0;
    let totalGuests = 0;

    for (const code in GUESTS_DATA) {
        const guest = GUESTS_DATA[code];
        const rsvp = guest.rsvp || {};
        const invitedCeremony = guest.ceremony;

        if (rsvp.is_attending !== undefined && rsvp.is_attending !== null) {
            replied++;
            if (rsvp.is_attending) {
                attending++;
                totalGuests += rsvp.guest_count || 0;
                if (invitedCeremony) ceremonyAttending += rsvp.guest_count || 0;
            } else {
                notAttending++;
            }
        } else {
            pending++;
        }
        if (invitedCeremony) ceremonyCount++;
    }

    document.getElementById('stat-replied').textContent = replied;
    document.getElementById('stat-attending').textContent = attending;
    document.getElementById('stat-not_attending').textContent = notAttending;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-ceremony').textContent = ceremonyAttending;
    document.getElementById('stat-total-guests').textContent = totalGuests;
}

// 名单弹窗入口
window.showGuestList = function(type) {
    let list = [];
    for (const code in GUESTS_DATA) {
        const guest = GUESTS_DATA[code];
        const rsvp = guest.rsvp || {};
        switch(type) {
            case 'replied':
                if (rsvp.is_attending !== undefined && rsvp.is_attending !== null) list.push(guest);
                break;
            case 'attending':
                if (rsvp.is_attending === true) list.push(guest);
                break;
            case 'not_attending':
                if (rsvp.is_attending === false) list.push(guest);
                break;
            case 'pending':
                if (rsvp.is_attending === undefined || rsvp.is_attending === null) list.push(guest);
                break;
            case 'ceremony':
                if (guest.ceremony && rsvp.is_attending === true) list.push(guest);
                break;
        }
    }
    showListDialog(type, list);
}

// 简单弹窗展示名单
function showListDialog(type, list) {
    let title = {
        replied: '已回复宾客',
        attending: '参加宾客',
        not_attending: '不参加宾客',
        pending: '未回复宾客',
        ceremony: '草坪仪式参加宾客'
    }[type] || '宾客名单';
    let html = '<div class="guest-list-dialog"><h3>' + title + '</h3>';
    if (list.length === 0) {
        html += '<p>暂无数据</p>';
    } else {
        html += '<ul>';
        for (const guest of list) {
            html += '<li>' + escapeHtml(guest.name);
            if (guest.rsvp && guest.rsvp.guest_count) {
                html += ' <span style="color:#aaa">(' + guest.rsvp.guest_count + '人)</span>';
            }
            html += '</li>';
        }
        html += '</ul>';
    }
    html += '<button class="btn btn-outline" onclick="closeGuestDialog()">关闭</button></div>';
    let dialog = document.createElement('div');
    dialog.id = 'guest-list-dialog-overlay';
    dialog.style.position = 'fixed';
    dialog.style.inset = '0';
    dialog.style.background = 'rgba(0,0,0,0.18)';
    dialog.style.zIndex = '9999';
    dialog.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%">' + html + '</div>';
    document.body.appendChild(dialog);
}
window.closeGuestDialog = function() {
    let dialog = document.getElementById('guest-list-dialog-overlay');
    if (dialog) dialog.remove();
}

// Calculate stats on page load
calculateStats();
