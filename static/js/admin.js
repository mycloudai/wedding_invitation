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

// ---------- Dropdown Menu ----------
window.toggleDropdown = function(code) {
    const dropdown = document.getElementById('dropdown-' + code);
    if (!dropdown) return;

    const isShowing = dropdown.classList.contains('show');

    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
        menu.classList.remove('show');
    });

    // Toggle current dropdown
    if (!isShowing) {
        dropdown.classList.add('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
            menu.classList.remove('show');
        });
    }
});

// Prevent dropdown from closing when clicking inside
document.addEventListener('click', function(e) {
    if (e.target.closest('.dropdown-item')) {
        // Close the dropdown after action
        setTimeout(function() {
            document.querySelectorAll('.dropdown-menu.show').forEach(function(menu) {
                menu.classList.remove('show');
            });
        }, 100);
    }
});

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

function copyInviteMessage(name, url) {
    const message = generateInviteMessage(name, url);
    copyText(message);
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
        '<td class="td-name">' +
            '<span class="guest-name-display">' + escapeHtml(name) + '</span>' +
            '<input type="text" class="guest-name-input" value="' + escapeHtml(name) + '" style="display:none;">' +
        '</td>' +
        '<td class="td-ceremony">' + ceremonyBadge + '</td>' +
        '<td class="td-rsvp"><span class="badge badge-pending">未回复</span></td>' +
        '<td class="td-count"><span class="guest-count-none">-</span></td>' +
        '<td class="td-actions">' +
            '<a href="' + shortUrl + '" target="_blank" class="btn btn-sm btn-primary">打开邀请函</a>' +
            '<button class="btn btn-sm btn-accent" onclick="copyInviteMessage(\'' + escapeHtml(name) + '\', \'' + escapeHtml(fullUrl) + '\')">复制邀请信息</button>' +
            '<div class="dropdown">' +
                '<button class="btn btn-sm btn-outline dropdown-toggle" onclick="toggleDropdown(\'' + code + '\')"><span>⋮</span></button>' +
                '<div class="dropdown-menu" id="dropdown-' + code + '">' +
                    '<a class="dropdown-item" onclick="copyText(\'' + escapeHtml(fullUrl) + '\')">📋 复制链接</a>' +
                    '<a class="dropdown-item" onclick="editGuestName(\'' + code + '\')">✏️ 编辑名字</a>' +
                    '<div class="dropdown-divider"></div>' +
                    '<a class="dropdown-item dropdown-item-danger" onclick="deleteGuest(\'' + code + '\')">🗑️ 删除</a>' +
                '</div>' +
            '</div>' +
            '<button class="btn btn-sm btn-primary btn-save" onclick="saveGuestName(\'' + code + '\')" style="display:none;">保存</button>' +
            '<button class="btn btn-sm btn-outline btn-cancel" onclick="cancelEditGuestName(\'' + code + '\')" style="display:none;">取消</button>' +
        '</td>';
    tbody.prepend(tr);

    // Update count
    updateCount(1);
}

// ---------- Edit Guest Name ----------
window.editGuestName = function(code) {
    const tr = document.querySelector('tr[data-code="' + code + '"]');
    if (!tr) return;

    const nameDisplay = tr.querySelector('.guest-name-display');
    const nameInput = tr.querySelector('.guest-name-input');
    const editBtn = tr.querySelector('.btn-edit');
    const saveBtn = tr.querySelector('.btn-save');
    const cancelBtn = tr.querySelector('.btn-cancel');

    // Switch to edit mode
    nameDisplay.style.display = 'none';
    nameInput.style.display = '';
    nameInput.focus();
    nameInput.select();

    editBtn.style.display = 'none';
    saveBtn.style.display = '';
    cancelBtn.style.display = '';

    // Add keyboard handlers
    nameInput.onkeydown = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveGuestName(code);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditGuestName(code);
        }
    };
}

window.cancelEditGuestName = function(code) {
    const tr = document.querySelector('tr[data-code="' + code + '"]');
    if (!tr) return;

    const nameDisplay = tr.querySelector('.guest-name-display');
    const nameInput = tr.querySelector('.guest-name-input');
    const editBtn = tr.querySelector('.btn-edit');
    const saveBtn = tr.querySelector('.btn-save');
    const cancelBtn = tr.querySelector('.btn-cancel');

    // Reset input to original value
    nameInput.value = nameDisplay.textContent;

    // Switch back to display mode
    nameDisplay.style.display = '';
    nameInput.style.display = 'none';

    editBtn.style.display = '';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

window.saveGuestName = async function(code) {
    const tr = document.querySelector('tr[data-code="' + code + '"]');
    if (!tr) return;

    const nameInput = tr.querySelector('.guest-name-input');
    const newName = nameInput.value.trim();

    if (!newName) {
        alert('请输入宾客姓名');
        return;
    }

    try {
        const resp = await fetch('/api/guests/' + code, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        const data = await resp.json();

        if (data.ok) {
            const nameDisplay = tr.querySelector('.guest-name-display');
            nameDisplay.textContent = newName;

            // Switch back to display mode
            cancelEditGuestName(code);

            showToast('名字已更新');
        } else {
            showToast(data.error || '更新失败');
        }
    } catch (err) {
        showToast('网络错误');
    }
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
        '<td class="td-name">' +
            '<span class="guest-name-display">' + escapeHtml(name) + '</span>' +
            '<input type="text" class="guest-name-input" value="' + escapeHtml(name) + '" style="display:none;">' +
        '</td>' +
        '<td class="td-ceremony">' + ceremonyBadge + '</td>' +
        '<td class="td-rsvp">' + rsvpHtml + '</td>' +
        '<td class="td-count">' + countHtml + '</td>' +
        '<td class="td-actions">' +
            '<a href="' + shortUrl + '" target="_blank" class="btn btn-sm btn-primary">打开邀请函</a>' +
            '<button class="btn btn-sm btn-accent" onclick="copyInviteMessage(\'' + escapeHtml(name) + '\', \'' + escapeHtml(fullUrl) + '\')">复制邀请信息</button>' +
            '<div class="dropdown">' +
                '<button class="btn btn-sm btn-outline dropdown-toggle" onclick="toggleDropdown(\'' + code + '\')"><span>⋮</span></button>' +
                '<div class="dropdown-menu" id="dropdown-' + code + '">' +
                    '<a class="dropdown-item" onclick="copyText(\'' + escapeHtml(fullUrl) + '\')">📋 复制链接</a>' +
                    '<a class="dropdown-item" onclick="editGuestName(\'' + code + '\')">✏️ 编辑名字</a>' +
                    '<div class="dropdown-divider"></div>' +
                    '<a class="dropdown-item dropdown-item-danger" onclick="deleteGuest(\'' + code + '\')">🗑️ 删除</a>' +
                '</div>' +
            '</div>' +
            '<button class="btn btn-sm btn-primary btn-save" onclick="saveGuestName(\'' + code + '\')" style="display:none;">保存</button>' +
            '<button class="btn btn-sm btn-outline btn-cancel" onclick="cancelEditGuestName(\'' + code + '\')" style="display:none;">取消</button>' +
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
function calculateStats(guestsData) {
    let replied = 0;
    let attending = 0;
    let notAttending = 0;
    let pending = 0;
    let ceremonyAttending = 0;
    let totalGuests = 0;

    for (const code in guestsData) {
        const guest = guestsData[code];
        const rsvp = guest.rsvp || {};
        const invitedCeremony = guest.ceremony;

        if (rsvp.is_attending !== undefined && rsvp.is_attending !== null) {
            replied++;
            if (rsvp.is_attending) {
                attending++;
                totalGuests += rsvp.guest_count || 0;
                if (invitedCeremony) {
                    ceremonyAttending += rsvp.guest_count || 0;
                }
            } else {
                notAttending++;
            }
        } else {
            pending++;
        }
    }

    document.getElementById('stat-replied').textContent = replied;
    document.getElementById('stat-attending').textContent = attending;
    document.getElementById('stat-not-attending').textContent = notAttending;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-ceremony').textContent = ceremonyAttending;
    document.getElementById('stat-total-guests').textContent = totalGuests;
}

// 名单弹窗入口
window.showGuestList = function(type) {
    if (typeof GUESTS_DATA === 'undefined') {
        alert('数据未加载');
        return;
    }

    let list = [];
    for (const code in GUESTS_DATA) {
        const guest = GUESTS_DATA[code];
        const rsvp = guest.rsvp || {};

        switch(type) {
            case 'replied':
                if (rsvp.is_attending !== undefined && rsvp.is_attending !== null) {
                    list.push(guest);
                }
                break;
            case 'attending':
                if (rsvp.is_attending === true) {
                    list.push(guest);
                }
                break;
            case 'not_attending':
                if (rsvp.is_attending === false) {
                    list.push(guest);
                }
                break;
            case 'pending':
                if (rsvp.is_attending === undefined || rsvp.is_attending === null) {
                    list.push(guest);
                }
                break;
            case 'ceremony':
                if (guest.ceremony && rsvp.is_attending === true) {
                    list.push(guest);
                }
                break;
        }
    }
    showListDialog(type, list);
}

// 简单弹窗展示名单
function showListDialog(type, list) {
    const titles = {
        replied: '已回复宾客',
        attending: '参加宾客',
        not_attending: '不参加宾客',
        pending: '未回复宾客',
        ceremony: '草坪仪式参加宾客'
    };

    let title = titles[type] || '宾客名单';
    let html = '<div class="guest-list-dialog"><h3>' + title + '</h3>';

    if (list.length === 0) {
        html += '<p>暂无数据</p>';
    } else {
        html += '<ul>';
        for (let i = 0; i < list.length; i++) {
            const guest = list[i];
            html += '<li>' + escapeHtml(guest.name);
            if (guest.rsvp && guest.rsvp.guest_count) {
                html += ' <span style="color:#aaa">(' + guest.rsvp.guest_count + '人)</span>';
            }
            html += '</li>';
        }
        html += '</ul>';
    }
    html += '<button class="btn btn-outline" onclick="closeGuestDialog()">关闭</button></div>';

    let overlay = document.createElement('div');
    overlay.id = 'guest-list-dialog-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.18)';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%">' + html + '</div>';
    document.body.appendChild(overlay);
}

window.closeGuestDialog = function() {
    let dialog = document.getElementById('guest-list-dialog-overlay');
    if (dialog) dialog.remove();
}

// ---------- Theme Management ----------
let currentTheme = 'classic';

// Load current theme on page load
async function loadCurrentTheme() {
    try {
        const resp = await fetch('/api/theme');
        const data = await resp.json();
        currentTheme = data.theme || 'classic';
        updateThemeUI(currentTheme);
    } catch (err) {
        console.error('Failed to load theme:', err);
    }
}

function updateThemeUI(theme) {
    // Update active state
    document.querySelectorAll('.theme-option').forEach(function(option) {
        if (option.dataset.theme === theme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

window.selectTheme = async function(theme) {
    if (theme === currentTheme) return;

    try {
        const resp = await fetch('/api/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: theme })
        });
        const data = await resp.json();

        if (data.ok) {
            currentTheme = theme;
            updateThemeUI(theme);
            showToast('主题已更换为：' + getThemeName(theme));
        } else {
            showToast('更换主题失败');
        }
    } catch (err) {
        showToast('网络错误');
    }
}

function getThemeName(theme) {
    const names = {
        'classic': '经典米色',
        'pink': '浪漫粉色',
        'blue': '优雅蓝色',
        'green': '清新绿色',
        'lavender': '薰衣草紫',
        'red': '喜庆红色'
    };
    return names[theme] || theme;
}

// Load theme on page load
loadCurrentTheme();

// Export attending guests
window.exportAttendingGuests = function() {
    if (typeof GUESTS_DATA === 'undefined') {
        alert('数据未加载');
        return;
    }

    let attendingGuests = [];
    for (const code in GUESTS_DATA) {
        const guest = GUESTS_DATA[code];
        const rsvp = guest.rsvp || {};

        if (rsvp.is_attending === true) {
            attendingGuests.push({
                name: guest.name,
                ceremony: guest.ceremony ? '是' : '否',
                guest_count: rsvp.guest_count || 0
            });
        }
    }

    if (attendingGuests.length === 0) {
        alert('暂无参加宾客');
        return;
    }

    // Generate CSV
    let csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += '宾客姓名,参加人数,参加草坪仪式\n';

    for (let i = 0; i < attendingGuests.length; i++) {
        const guest = attendingGuests[i];
        csv += guest.name + ',' + guest.guest_count + ',' + guest.ceremony + '\n';
    }

    // Download
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement('a');
    let url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', '参加宾客名单_' + new Date().toISOString().slice(0, 10) + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('导出成功：' + attendingGuests.length + ' 位宾客');
}
