<template>
    <section>
        <div style="display: flex; align-items: center; gap: 10px;">
            <h2 style="margin: 0;">編輯代理</h2>
            <button @click="handleQuickCreate" style="background-color: #ffbf00; color: #333; padding: 8px 16px; font-size: 16px;">快速創建</button>
        </div>
        <p id="proxy-count" style="color: black;"></p>
        <div v-if="!isInDiscordGroup" class="discord-status">
            偵測到未加入Discord，請及時加入，否則將無法啟動代理！
            <button @click="openDiscord">加入Discord</button>
        </div>
        <div id="account-expired-status" class="discord-status">
            帳號已經到期，無法啟動代理！請聯絡TaiwanFRP
            <button @click="openDiscord">聯絡我們</button>
        </div>
        <div id="tunnel-container"></div>
        <div v-if="tunnels.length === 0" style="color: black;">沒有代理，請點擊新增代理來添加一個。</div>
        <div class="button-group">
            <button class="add-button" @click="addTunnel">新增代理</button>
            <button class="save-button" @click="saveFrpcIni">保存/啟用heartbeat</button>
        </div>
    </section>

    <form id="edit-tunnel-form" style="display: none;">
        <!-- Form fields for editing the tunnel -->
    </form>

    <div id="message-box" class="message-box"></div>
    <div id="overlay" class="overlay"></div>
    <div id="quickcreate-modal" class="message-box" style="display:none;"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';

const router = useRouter()

const username = Cookies.get("username")
const password = Cookies.get("password")
const adminchanguser = Cookies.get("adminchanguser") || null
const adminVerificationCode = Cookies.get("admin_verification_code") || null

const isInDiscordGroup = ref(false)

const nodes = ref([])
const commonSection = ref("")
const tunnels = ref([])
const ipTipHoverIndex = ref(null)

checkLogin()
checkDiscordStatus()
checkExpirationStatus()

onMounted(() => {
    // if (!Cookies.get("username") || !Cookies.get("password")) {
    //     router.push("/login")
    // }
    loadNodes().then(() => {
        loadFrpcIni();
    })
    setInterval(updateTunnelData, 5000); // 每5秒更新一次
})


// document.addEventListener('DOMContentLoaded', () => {
//     checkLogin();
//     loadNodes().then(() => {
//         loadFrpcIni();
//     });
//     checkDiscordStatus();
//     checkExpirationStatus();
//     setInterval(updateTunnelData, 5000); // Update every 5 seconds
//     // 修正：將 quick-create-btn 綁定放到 DOMContentLoaded 事件內
//     const quickCreateBtn = document.getElementById('quick-create-btn');
//     if (quickCreateBtn) {
//         quickCreateBtn.addEventListener('click', handleQuickCreate);
//     }
// });

async function loadNodes() {
    const response = await fetch(import.meta.env.VITE_API_URL + "/nodes.json")
    if (response.ok) {
        const data = await response.json()
        nodes = data.nodes || []
    } else {
        alert("無法載入節點資料，請稍後再試。")
        console.error("Error loading nodes:", response.status, response.statusText)
    }
}

async function loadFrpcIni() {
    try {
        if (adminVerificationCode) {
            const response = await fetch(import.meta.env.VITE_API_URL + "/admin_login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    verificationCode: adminVerificationCode
                })
            });

            if (response.ok) {
                await loadTunnelsFromNodes(adminchanguser, adminVerificationCode);
                return;
            } else {
                alert("驗證碼或密碼到期，請重新登入。");
                router.push("/login");
            }
        }

        if (username && password) {
            const response = await fetch(import.meta.env.VITE_API_URL + "/verify_credentials", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username, password})
            })

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    await loadTunnelsFromNodes(username, password);
                } else {
                    alert("驗證碼或密碼到期，請重新登入。");
                    router.push("/login");
                }
            } else {
                alert("驗證碼或密碼到期，請重新登入。");
                router.push("/login");
            }
        } else if (adminchanguser && adminVerificationCode) {
            await loadTunnelsFromNodes(adminchanguser, adminVerificationCode);
        } else {
            alert("請先登入或提供有效的驗證碼。");
            router.push("/login");
        }
    } catch (error) {
        alert("驗證碼或密碼到期，請重新登入。");
        router.push("/login");
    }
}

async function loadTunnelsFromNodes(username, password) {
    tunnels = [];
    for (const node of nodes) {
        const response = await fetch(import.meta.env.VITE_API_URL + `/get_frpc_ini?username=${username}&password=${password}&nodeName=${node.name}`);
        if (response.ok) {
            const content = await response.text();
            parseFrpcIni(content, node.name);
        }
    }
    renderTunnels();
}

async function notifyDisabledTunnels() {
    if (adminchanguser && adminVerificationCode) {
        username = adminchanguser;
        password = adminVerificationCode;
    } else {
        username = Cookies.get("username");
        password = Cookies.get("password");
    }

    const disabledTunnels = tunnels
        .filter(t => !t.enabled)
        .map(t => ({
            name: t.name,
            node: t.node
        }))
    
    const body = {
        username,
        password,
        tunnels: disabledTunnels
    }
    if (adminchanguser && adminVerificationCode) {
        body.admin_verification_code = adminVerificationCode;
    }

    try {
        await fetch(import.meta.env.VITE_API_URL + "/api/disable_tunnels", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        })
    } catch (error) {
        console.error("Error notifying disabled tunnels:", error);
    }
}

async function saveFrpcIni() {
    if (!validateTunnels()) {
        return;
    }

    for (const node of nodes) {
        const content = generateFrpcIniContent(node.name);
        const tunnelStatuses = tunnels
            .filter(tunnel => tunnel.node === node.name)
            .map(tunnel => {
                const remotePort = getConfigValue(tunnel.config, 'remote_port');
                const [minPort, maxPort] = node.availablePorts.split('-').map(Number);

                if (remotePort < minPort || remotePort > maxPort) {
                    alert(`節點 ${node.name} 的遠程端口 ${remotePort} 不在允許範圍內 (${minPort}-${maxPort})`);
                    throw new Error('遠程端口超出範圍');
                }

                return {
                    remote_port: remotePort,
                    enabled: tunnel.enabled
                };
            });

        const disabledTunnels = tunnels
            .filter(tunnel => tunnel.node === node.name && !tunnel.enabled)
            .map(tunnel => ({
                tunnelName: tunnel.name,
                remotePort: getConfigValue(tunnel.config, 'remote_port'),
                nodeName: node.name,
                username: username ? username.split('=')[1] : adminchanguser.split('=')[1],
                password: password ? password.split('=')[1] : adminVerificationCode.split('=')[1]
            }));

        try {
            disabledTunnels.forEach(tunnel => {
                fetch(import.meta.env.VITE_API_URL + "/send_disabled_tunnel", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(adminVerificationCode
                            ? {
                                'adminchanguser': adminchanguser.split('=')[1],
                                'admin_verification_code': adminVerificationCode.split('=')[1]
                            }
                            : {})
                    },
                    body: JSON.stringify(tunnel)
                }).then(response => {
                    if (!response.ok) {
                        console.error('Failed to log disabled tunnel:', tunnel);
                    }
                });
            });

            const response = await fetch(import.meta.env.VITE_API_URL + "/save_frpc_ini", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(adminVerificationCode
                        ? {
                            'adminchanguser': adminchanguser.split('=')[1],
                            'admin_verification_code': adminVerificationCode.split('=')[1]
                        }
                        : {})
                },
                body: JSON.stringify({ content, nodeName: node.name, tunnelStatuses })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.occupiedPorts) {
                    errorData.occupiedPorts.forEach(port => {
                        const index = tunnels.findIndex(tunnel => getConfigValue(tunnel.config, 'remote_port') === port);
                        const remotePortError = document.querySelector(`#remote-port-error-${index}`);
                        if (errorData.occupiedBy[index] !== (username ? username.split('=')[1] : adminchanguser.split('=')[1])) {
                            remotePortError.textContent = `遠程端口 ${port} 已被佔用`;
                        }
                    });
                    alert('保存失敗: 部分遠程端口已被佔用，請更換端口: ' + errorData.occupiedPorts.join(', '));
                    return;
                } else {
                    alert('保存失敗');
                    return;
                }
            }
        } catch (error) {
            alert("驗證碼或密碼到期");
            router.push("/login");
            return;
        }
    }

    await notifyDisabledTunnels();
    alert("保存成功，請重啟客戶端，停用的代理(如果有)會在90秒內被踢下線。");
}

async function checkPortUsage(port, index) {
    const response = await fetch(import.meta.env.VITE_API_URL + `/check_port/${port}`);
    if (response.ok) {
        const data = await response.json();
        const remotePortError = document.querySelector(`#remote-port-error-${index}`);
        if (data.occupied && data.username && data.username !== username) {
            remotePortError.textContent = `遠程端口 ${port} 已被 ${data.username} 佔用`;
        } else {
            remotePortError.textContent = '';
        }
    } else {
        console.error('Failed to check port usage');
    }
}

function parseFrpcIni(content, nodeName) {
    const lines = content.split('\n');
    let currentTunnel = null;
    let inCommonSection = false;
    const tunnelMap = new Map();

    lines.forEach(line => {
        if (line.startsWith('[common]')) {
            inCommonSection = true;
            commonSection = line + '\n';
        } else if (inCommonSection && (line.startsWith('server_addr') || line.startsWith('server_port') || line.startsWith('user') || line.startsWith('meta_token'))) {
            commonSection += line + '\n';
        } else if (line.startsWith('[') && line.endsWith(']')) {
            inCommonSection = false;
            if (currentTunnel) {
                // 新增: 根據 config 是否有 protocol = kcp 設置 kcpEnabled
                currentTunnel.kcpEnabled = /protocol\s*=\s*kcp/.test(currentTunnel.config);
                if (!tunnelMap.has(currentTunnel.name)) {
                    tunnelMap.set(currentTunnel.name, currentTunnel);
                } else {
                    tunnelMap.get(currentTunnel.name).config += currentTunnel.config;
                    tunnelMap.get(currentTunnel.name).enabled = tunnelMap.get(currentTunnel.name).enabled && currentTunnel.enabled;
                    // 合併時也要合併 kcpEnabled
                    tunnelMap.get(currentTunnel.name).kcpEnabled = tunnelMap.get(currentTunnel.name).kcpEnabled || currentTunnel.kcpEnabled;
                }
            }
            currentTunnel = { 
                name: line.slice(1, -1).replace(',udp', ''), 
                config: '', 
                node: nodeName, 
                enabled: true 
            };
        } else if (currentTunnel && !inCommonSection) {
            currentTunnel.config += line + '\n';
            if (line.trim() === '# disable=true') {
                currentTunnel.enabled = false;
            }
        }
    });

    if (currentTunnel) {
        // 新增: 根據 config 是否有 protocol = kcp 設置 kcpEnabled
        currentTunnel.kcpEnabled = /protocol\s*=\s*kcp/.test(currentTunnel.config);
        if (!tunnelMap.has(currentTunnel.name)) {
            tunnelMap.set(currentTunnel.name, currentTunnel);
        } else {
            tunnelMap.get(currentTunnel.name).config += currentTunnel.config;
            tunnelMap.get(currentTunnel.name).enabled = tunnelMap.get(currentTunnel.name).enabled && currentTunnel.enabled;
            // 合併時也要合併 kcpEnabled
            tunnelMap.get(currentTunnel.name).kcpEnabled = tunnelMap.get(currentTunnel.name).kcpEnabled || currentTunnel.kcpEnabled;
        }
    }

    tunnels = tunnels.concat(Array.from(tunnelMap.values()).filter(tunnel => tunnel.name !== 'common'));
}

async function updateAddButtonVisibility() {
    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/check_proxy_limit", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password, adminVerificationCode })
        });

        if (response.ok) {
            const data = await response.json();
            const remainingProxies = data.remainingProxies;
            const addButton = document.querySelector('.add-button');

            if (tunnels.length >= remainingProxies) {
                addButton.style.display = 'none';
            } else {
                addButton.style.display = 'inline-block';
            }
        } else {
            console.error('Failed to fetch remaining proxies');
        }
    } catch (error) {
        console.error('Error fetching remaining proxies:', error);
    }
}

async function updateProxyCount() {
    if (!username || !password) {
        console.error('Missing username or password in cookies');
        return;
    }

    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/check_proxy_limit", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, adminVerificationCode })
        });

        if (response.ok) {
            const data = await response.json();
            const remainingProxies = parseInt(data.remainingProxies, 10);
            const totalProxies = parseInt(data.totalProxies || 0, 10); // Default to 0 if undefined

            if (!isNaN(remainingProxies)) {
                const proxyCountElement = document.getElementById('proxy-count');
                const createdProxies = tunnels.length; // Count the number of existing tunnels

                if (createdProxies >= remainingProxies) {
                    proxyCountElement.innerHTML = `<span style="color: black;">可創建: ${remainingProxies} / <span style="color: #FF8C00;">已創建: ${createdProxies}</span>`;
                } else {
                    proxyCountElement.innerHTML = `<span style="color: black;">可創建: ${remainingProxies} / <span style="color: green;">已創建: ${createdProxies}`;
                }
            } else {
                console.error('Invalid proxy count data received:', data);
            }
        } else {
            console.error('Failed to fetch proxy count');
        }
    } catch (error) {
        console.error('Error fetching proxy count:', error);
    }
}

function renderTunnels() {
    const tunnelContainer = document.getElementById('tunnel-container');
    const noTunnelMessage = document.getElementById('no-tunnel-message');
    tunnelContainer.innerHTML = '';

    if (tunnels.length === 0) {
        noTunnelMessage.style.display = 'block';
    } else {
        noTunnelMessage.style.display = 'none';
        tunnels.forEach((tunnel, index) => {
            const tunnelDiv = document.createElement('div');
            tunnelDiv.className = 'tunnel';
            tunnelDiv.id = `tunnel-${tunnel.name}`;

            // 取得目前節點
            const node = nodes.find(n => n.name === tunnel.node);
            // 取得遠程端口
            const remotePort = getConfigValue(tunnel.config, 'remote_port');
            // 顯示 ip 位置（只有當節點和遠程端口都有效且遠程端口在範圍內時才顯示）
            let ipLocationHtml = '';
            let showIp = false;
            if (node && remotePort && !isNaN(Number(remotePort))) {
                const [minPort, maxPort] = node.availablePorts.split('-').map(Number);
                if (Number(remotePort) >= minPort && Number(remotePort) <= maxPort) {
                    showIp = true;
                }
            }
            if (showIp) {
                ipLocationHtml = `<div class="ip-location-tip-wrapper" style="position:relative;display:inline-block;">
                    <div style=\"color:#fff;background:#007bff;font-weight:bold;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:5px;cursor:pointer;\" id='ip-location-box-${index}' onmouseenter="showIpTip(${index})" onmouseleave="hideIpTip(${index})" onclick="copyIpLocation(${index})">
                        連線位置: <span id='ip-location-${index}' style='color:#ffeb3b;'>${node.ip}:${remotePort}</span>
                    </div>
                    <div id="ip-tip-${index}" class="ip-tip-popup" style="display:none;position:absolute;top:-38px;left:0;z-index:10;background:rgba(0,0,0,0.85);color:#fff;padding:6px 14px;border-radius:6px;font-size:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);pointer-events:none;">點擊來複製</div>
                </div>`;
            } else {
                ipLocationHtml = `<div class=\"ip-location-tip-wrapper\" style=\"position:relative;display:inline-block;\"><div style=\"color:#fff;background:#888;font-weight:bold;padding:4px 8px;border-radius:4px;display:inline-block;margin-bottom:5px;\" id='ip-location-box-${index}' onmouseenter="showIpTip(${index})" onmouseleave="hideIpTip(${index})">連線位置: <span id='ip-location-${index}' style='color:#ffeb3b;'>-</span></div><div id="ip-tip-${index}" class="ip-tip-popup" style="display:none;position:absolute;top:-38px;left:0;z-index:10;background:rgba(0,0,0,0.85);color:#fff;padding:6px 14px;border-radius:6px;font-size:14px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);pointer-events:none;">點擊來複製</div></div>`;
            }

            // 新增低延遲模式(KCP)開關，使用相同的 proxy-toggle 樣式
            if (typeof tunnel.kcpEnabled === 'undefined') tunnel.kcpEnabled = true;
            const kcpSwitchHtml = `
                <div style="margin-top: 8px;">
                    <label style="color:#000;">啟用低延遲模式(KCP):</label>
                    <div class="proxy-toggle ${tunnel.kcpEnabled ? 'enabled' : ''}" data-index="${index}" data-kcp-toggle="true" onclick="toggleKcpProxy(event)"></div>
                </div>
            `;

            tunnelDiv.innerHTML = `
                <label>代理名稱:</label>
                <input type="text" value="${tunnel.name}" placeholder="代理名稱" data-index="${index}" oninput="updateTunnelName(event)">
                <label>本地 IP:</label>
                <input type="text" value="${getConfigValue(tunnel.config, 'local_ip')}" placeholder="127.0.0.1" data-index="${index}" oninput="updateTunnelConfig(event, 'local_ip')">
                <label>本地端口:</label>
                <input type="number" value="${getConfigValue(tunnel.config, 'local_port')}" placeholder="1-65535" min="1" max="65535" data-index="${index}" oninput="validateLocalPort(event); updateTunnelConfig(event, 'local_port')">
                <div id="local-port-error-${index}" class="error-message"></div>
                <label>遠程端口:</label>
                <input type="number" value="${getConfigValue(tunnel.config, 'remote_port')}" placeholder="10000-65535" min="10000" max="65535" data-index="${index}" oninput="validateRemotePort(event); updateTunnelConfig(event, 'remote_port'); checkPortUsage(event.target.value, ${index}); updateIpLocation(${index}); checkPortRangeOnInput(event)">
                <div id="remote-port-error-${index}" class="error-message"></div>
                ${kcpSwitchHtml}
                <label>節點:</label>
                <select data-index="${index}" onchange="updateTunnelNode(event); updateIpLocation(${index})">
                    <option value="未選擇" disabled ${tunnel.node === '未選擇' ? 'selected' : ''}>未選擇</option>
                    ${nodes.map(node => `<option value="${node.name}" ${tunnel.node === node.name ? 'selected' : ''}>${node.name}</option>`).join('')}
                </select>
                <div style="margin-top: 8px;">
                    ${ipLocationHtml}
                </div>
                <div style="margin-top: 10px;">
                    <label>啟用代理:</label>
                    <div class="proxy-toggle ${tunnel.enabled ? 'enabled' : ''}" data-index="${index}" onclick="toggleProxy(event)"></div>
                </div>
                <div class="tunnel-status" id="tunnel-status-${tunnel.name}"></div>
                <button class="delete-button" @click="deleteTunnel(index)">刪除這個代理</button>
            `;
            tunnelContainer.appendChild(tunnelDiv);
        });
        updateTunnelData();
    }

    updateAddButtonVisibility();
    updateProxyCount(); // Update proxy count after rendering tunnels
};

// 新增：KCP模式開關事件，使用 proxy-toggle 樣式
function toggleKcpProxy(event) {
    const index = event.target.dataset.index;
    tunnels[index].kcpEnabled = !tunnels[index].kcpEnabled;
    event.target.classList.toggle('enabled', tunnels[index].kcpEnabled);
}

// 新增：即時更新連線位置，只有在遠程端口在節點範圍內時才顯示
function updateIpLocation(index) {
    const tunnel = tunnels[index];
    const node = nodes.find(n => n.name === tunnel.node);
    const remotePort = getConfigValue(tunnel.config, 'remote_port');
    const ipSpan = document.getElementById(`ip-location-${index}`);
    const ipBox = document.getElementById(`ip-location-box-${index}`);
    const tip = document.getElementById(`ip-tip-${index}`);
    const remotePortError = document.querySelector(`#remote-port-error-${index}`);
    if (ipSpan && ipBox) {
        if (node && remotePort && !isNaN(Number(remotePort))) {
            const [minPort, maxPort] = node.availablePorts.split('-').map(Number);
            if (Number(remotePort) >= minPort && Number(remotePort) <= maxPort) {
                // 顯示ip，背景藍色，可複製
                ipSpan.textContent = `${node.ip}:${remotePort}`;
                ipBox.style.background = '#007bff';
                ipBox.style.cursor = 'pointer';
                ipBox.onclick = () => copyIpLocation(index);
                ipBox.onmouseenter = () => showIpTip(index);
                ipBox.onmouseleave = () => hideIpTip(index);
                if (tip) tip.style.display = 'none';
                // 立刻檢查端口佔用
                let username = '';
                const usernameCookie = document.cookie.split('; ').find(row => row.startsWith('username='));
                const adminchanguserCookie = document.cookie.split('; ').find(row => row.startsWith('adminchanguser='));
                if (usernameCookie) {
                    username = usernameCookie.split('=')[1];
                } else if (adminchanguserCookie) {
                    username = adminchanguserCookie.split('=')[1];
                }
                fetch(import.meta.env.VITE_API_URL + `/check_port_usage?port=${remotePort}&nodeName=${encodeURIComponent(node.name)}`)
                    .then(resp => resp.json())
                    .then(data => {
                        if (data.occupied && data.username && data.username !== username) {
                            remotePortError.textContent = `遠程端口 ${remotePort} 已被佔用`;
                        } else {
                            remotePortError.textContent = '';
                        }
                    })
                    .catch(() => {
                        remotePortError.textContent = '端口檢查失敗';
                    });
            } else {
                ipSpan.textContent = '無法載入';
                ipBox.style.background = '#888';
                ipBox.style.cursor = 'default';
                ipBox.onclick = null;
                ipBox.onmouseenter = null;
                ipBox.onmouseleave = null;
                if (tip) tip.style.display = 'none';
                remotePortError.textContent = '';
            }
        } else {
            ipSpan.textContent = '無法載入';
            ipBox.style.background = '#888';
            ipBox.style.cursor = 'default';
            ipBox.onclick = null;
            ipBox.onmouseenter = null;
            ipBox.onmouseleave = null;
            if (tip) tip.style.display = 'none';
            remotePortError.textContent = '';
        }
    }
}

// 新增：懸浮提示與點擊複製，無法載入時不能複製
function showIpTip(index) {
    const tip = document.getElementById(`ip-tip-${index}`);
    ipTipHoverIndex = index;
    if (tip) {
        tip.textContent = '點擊來複製';
        tip.style.display = 'block';
    }
}

function hideIpTip(index) {
    const tip = document.getElementById(`ip-tip-${index}`);
    if (tip) {
        tip.style.display = 'none';
    }
    // 只有滑鼠離開時才重設
    if (ipTipHoverIndex === index) ipTipHoverIndex = null;
}

function copyIpLocation(index) {
    const ipSpan = document.getElementById(`ip-location-${index}`);
    const tip = document.getElementById(`ip-tip-${index}`);
    // 只有正確 IP 才能複製
    if (ipSpan && ipSpan.textContent && ipSpan.textContent !== '-' && ipSpan.textContent !== '無法載入') {
        navigator.clipboard.writeText(ipSpan.textContent).then(() => {
            if (tip) {
                tip.textContent = '已複製!';
                tip.style.display = 'block';
                const thisIndex = index;
                setTimeout(() => {
                    if (ipTipHoverIndex === thisIndex) {
                        tip.textContent = '點擊來複製';
                        tip.style.display = 'block';
                    } else {
                        tip.style.display = 'none';
                    }
                }, 1000);
            }
        });
    }
}

function toggleProxy(event) {
    const index = event.target.dataset.index;
    tunnels[index].enabled = !tunnels[index].enabled;
    const toggle = event.target;
    toggle.classList.toggle('enabled', tunnels[index].enabled);
}

async function updateTunnelData() {
    const usernameCookie = document.cookie.split('; ').find(row => row.startsWith('username='));
    const passwordCookie = document.cookie.split('; ').find(row => row.startsWith('password='));
    const adminchanguserCookie = document.cookie.split('; ').find(row => row.startsWith('adminchanguser='));
    const adminVerificationCodeCookie = document.cookie.split('; ').find(row => row.startsWith('admin_verification_code='));

    const username = adminchanguserCookie ? adminchanguserCookie.split('=')[1] : usernameCookie.split('=')[1];
    const password = adminVerificationCodeCookie ? adminVerificationCodeCookie.split('=')[1] : passwordCookie.split('=')[1];

    for (const tunnel of tunnels) {
        const tcpResponse = await fetch(import.meta.env.VITE_API_URL + "/check_tunnel", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, tunnelName: tunnel.name, protocol: 'tcp', nodeName: tunnel.node || nodes[0].name })
        });

        const udpResponse = await fetch(import.meta.env.VITE_API_URL + "/check_tunnel", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, tunnelName: tunnel.name, protocol: 'udp', nodeName: tunnel.node || nodes[0].name })
        });

        const tcpData = tcpResponse.ok ? await tcpResponse.json() : { status: 'offline' };
        const udpData = udpResponse.ok ? await udpResponse.json() : { status: 'offline' };

        const convertToReadableSize = (bytes) => {
            if (bytes < 1024) {
                return `${bytes.toFixed(2)} B`;
            } else if (bytes < 1024 * 1024) {
                return `${(bytes / 1024).toFixed(2)} KB`;
            } else if (bytes < 1024 * 1024 * 1024) {
                return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            } else {
                return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
            }
        };

        const tunnelStatusDiv = document.getElementById(`tunnel-status-${tunnel.name}`);
        if (tunnelStatusDiv) {
            tunnelStatusDiv.innerHTML = `
                <div class="tunnel-status ${tcpData.status === 'online' ? 'tunnel-status-online' : 'tunnel-status-offline'}">
                    <p>TCP 狀態: ${tcpData.status === 'online' ? '在線' : '離線'}</p>
                    <p>現在連線數: ${tcpData.cur_conns || 0}</p>
                    <p>上次啟動時間: ${tcpData.last_start_time || '從未啟動'}</p>
                    <p>今日流量: 入網 ${convertToReadableSize(tcpData.today_traffic_in || 0)} / 出網 ${convertToReadableSize(tcpData.today_traffic_out || 0)}</p>
                </div>
                <div class="tunnel-status ${udpData.status === 'online' ? 'tunnel-status-online' : 'tunnel-status-offline'}">
                    <p>UDP 狀態: ${udpData.status === 'online' ? '在線' : '離線'}</p>
                    <p>現在連線數: ${udpData.cur_conns || 0}</p>
                    <p>上次啟動時間: ${udpData.last_start_time || '從未啟動'}</p>
                    <p>今日流量: 入網 ${convertToReadableSize(udpData.today_traffic_in || 0)} / 出網 ${convertToReadableSize(udpData.today_traffic_out || 0)}</p>
                </div>
            `;
        }
    }
}

function validateLocalPort(event) {
    const value = event.target.value;
    const index = event.target.dataset.index;
    const errorElement = document.querySelector(`#local-port-error-${index}`);
    if (value < 1 || value > 65535) {
        errorElement.textContent = '本地端口必須在1到65535之間';
    } else {
        errorElement.textContent = '';
    }
}

function validateRemotePort(event) {
    const value = event.target.value;
    const index = event.target.dataset.index;
    const errorElement = document.querySelector(`#remote-port-error-${index}`);

    const nodeName = tunnels[index].node;
    const selectedNode = nodes.find(node => node.name === nodeName);
    if (selectedNode) {
        const [minPort, maxPort] = selectedNode.availablePorts.split('-').map(Number);
        if (value < minPort || value > maxPort) {
            errorElement.textContent = `遠程端口必須在${minPort}到${maxPort}之間`;
        } else {
            errorElement.textContent = '';
        }
    }
}

function checkPortRangeOnInput(event) {
    const index = event.target.dataset.index;
    const value = Number(event.target.value);
    const nodeName = tunnels[index].node;
    const selectedNode = nodes.find(node => node.name === nodeName);
    const remotePortError = document.querySelector(`#remote-port-error-${index}`);
    if (selectedNode) {
        const [minPort, maxPort] = selectedNode.availablePorts.split('-').map(Number);
        if (value && (value < minPort || value > maxPort)) {
            remotePortError.textContent = `遠程端口必須在(${minPort}到${maxPort})之間，${value}不可用`;
        } else {
            remotePortError.textContent = '';
        }
    } else {
        remotePortError.textContent = '';
    }
}

function getConfigValue(config, key) {
    const match = config.match(new RegExp(`${key} = (.+)`));
    return match ? match[1] : '';
}

function updateTunnelName(event) {
    const index = event.target.dataset.index;
    const newName = event.target.value;
    if (newName.toLowerCase() === 'common') {
        alert('代理名稱不能為 "common"');
        event.target.value = tunnels[index].name;
        return;
    }
    tunnels[index].name = newName;
}

function updateTunnelConfig(event, key) {
    const index = event.target.dataset.index;
    const value = event.target.value;
    const configLines = tunnels[index].config.split('\n');
    const newConfigLines = configLines.map(line => {
        if (line.startsWith(`${key} =`)) {
            return `${key} = ${value}`;
        }
        return line;
    });
    tunnels[index].config = newConfigLines.join('\n');
}

function updateTunnelNode(event) {
    const index = event.target.dataset.index;
    const nodeName = event.target.value;
    tunnels[index].node = nodeName;

    const selectedNode = nodes.find(node => node.name === nodeName);
    if (selectedNode) {
        const availablePorts = selectedNode.availablePorts;
        const [minPort, maxPort] = availablePorts.split('-').map(Number);

        const remotePortInput = document.querySelector(`input[data-index='${index}'][placeholder='10000-65535']`);
        remotePortInput.min = minPort;
        remotePortInput.max = maxPort;
        remotePortInput.placeholder = `${minPort}-${maxPort}`;
    }
}

async function addTunnel() {
    const username = document.cookie.split('; ').find(row => row.startsWith('username='))?.split('=')[1] || document.cookie.split('; ').find(row => row.startsWith('adminchanguser='))?.split('=')[1];
    const password = document.cookie.split('; ').find(row => row.startsWith('password='))?.split('=')[1];
    const verificationCode = document.cookie.split('; ').find(row => row.startsWith('admin_verification_code='))?.split('=')[1];

    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/check_proxy_limit", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, verificationCode })
        });

        if (response.ok) {
            const data = await response.json();
            const remainingProxies = data.remainingProxies;

            if (tunnels.length < remainingProxies) {
                const newTunnel = {
                    name: '',
                    config: 'type = tcp\nlocal_ip = 127.0.0.1\nlocal_port = \nremote_port = ',
                    node: '未選擇', // Default to "未選擇"
                    enabled: true,
                    kcpEnabled: true // 預設啟用
                };
                tunnels.push(newTunnel);
                renderTunnels();
                await updateProxyCount(); // Update proxy count after adding a tunnel
            } else {
                alert('已達到代理數量上限，無法新增代理');
            }
        } else {
            console.error('Failed to fetch remaining proxies');
        }
    } catch (error) {
        console.error('Error fetching remaining proxies:', error);
    }
}

function deleteTunnel(index) {
    tunnels.value.splice(index, 1);
    renderTunnels();
    updateProxyCount(); // Update proxy count after deleting a tunnel
}

function generateFrpcIniContent(nodeName) {
    const tunnelSections = tunnels
        .filter(tunnel => tunnel.node === nodeName)
        .map(tunnel => `
[${tunnel.name}]
type = tcp
local_ip = ${getConfigValue(tunnel.config, 'local_ip')}
local_port = ${getConfigValue(tunnel.config, 'local_port')}
remote_port = ${getConfigValue(tunnel.config, 'remote_port')}
${tunnel.kcpEnabled ? 'protocol = kcp\n' : ''}bandwidth_limit = 3096KB
${!tunnel.enabled ? '# disable=true' : ''}
[${tunnel.name},udp]
type = udp
local_ip = ${getConfigValue(tunnel.config, 'local_ip')}
local_port = ${getConfigValue(tunnel.config, 'local_port')}
remote_port = ${getConfigValue(tunnel.config, 'remote_port')}
${tunnel.kcpEnabled ? 'protocol = kcp\n' : ''}bandwidth_limit = 3096KB
${!tunnel.enabled ? '# disable=true' : ''}`).join('\n');

    return commonSection + '\n' + tunnelSections;
}

function checkLogin() {
    const usernameCookie = document.cookie.split('; ').find(row => row.startsWith('username='));
    const passwordCookie = document.cookie.split('; ').find(row => row.startsWith('password='));
    const adminVerificationCode = document.cookie.split('; ').find(row => row.startsWith('admin_verification_code='));
    if (!usernameCookie && !adminVerificationCode) {
        alert('請先登入');
        router.push("/login");
    }
}

function showMessage(message, success = false, callback = null) {
    const messageBox = document.getElementById('message-box');
    const overlay = document.getElementById('overlay');
    messageBox.innerHTML = `<p>${message}</p>`;
    if (success) {
        messageBox.innerHTML += `<button onclick="window.location.href='index.html'">確定</button>`;
    } else {
        messageBox.innerHTML += `<button onclick="hideMessage()">取消</button>`;
    }
    if (callback) {
        messageBox.innerHTML += `<button onclick="${callback}">確定</button>`;
    }
    messageBox.style.display = 'block';
    overlay.style.display = 'block';
    document.addEventListener('keydown', handleEnterKey);
}

function hideMessage() {
    document.getElementById('message-box').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
    document.removeEventListener('keydown', handleEnterKey);
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        const button = document.querySelector('.message-box button');
        if (button) {
            button.click();
        }
    }
}

function validateTunnels() {
    let isValid = true;
    tunnels.forEach((tunnel, index) => {
        const localPort = parseInt(getConfigValue(tunnel.config, 'local_port'), 10);
        const remotePort = parseInt(getConfigValue(tunnel.config, 'remote_port'), 10);
        const localPortError = document.querySelector(`#local-port-error-${index}`);
        const remotePortError = document.querySelector(`#remote-port-error-${index}`);

        // 新增：代理名稱禁止有空格
        if (tunnel.name && tunnel.name.includes(' ')) {
            alert('代理名稱不能包含空格');
            isValid = false;
        }

        if (!tunnel.name || !getConfigValue(tunnel.config, 'local_ip') || !localPort || !remotePort) {
            alert('請填寫所有代理名稱、本地 IP、本地端口和遠程端口');
            isValid = false;
        }

        if (localPort < 1 || localPort > 65535) {
            localPortError.textContent = '本地端口必須在1到65535之間';
            isValid = false;
        } else {
            localPortError.textContent = '';
        }

        const nodeName = tunnels[index].node;
        if (!nodes.some(node => node.name === nodeName)) {
            alert('請選擇有效的節點');
            isValid = false;
        }

        const selectedNode = nodes.find(node => node.name === nodeName);
        if (selectedNode) {
            const [minPort, maxPort] = selectedNode.availablePorts.split('-').map(Number);
            if (remotePort < minPort || remotePort > maxPort) {
                remotePortError.textContent = `遠程端口必須在${minPort}到${maxPort}之間`;
                isValid = false;
            } else {
                remotePortError.textContent = '';
            }
        }
    });
    return isValid;
}

async function checkDiscordStatus() {
    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/verify_discord_status", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            isInDiscordGroup.value = data.inGroup;
        } else {
            console.error("Failed to verify Discord status");
            isInDiscordGroup.value = false;
        }
    } catch (error) {
        console.error("Error verifying Discord status:", error);
        isInDiscordGroup.value = false;
    }
}

async function checkExpirationStatus() {
    const response = await fetch(import.meta.env.VITE_API_URL + "/check_expiration", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.expired) {
            document.getElementById('account-expired-status').style.display = 'block';
        }
    } else {
        console.error('Failed to check expiration status');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const username = document.cookie.split('; ').find(row => row.startsWith('username=')).split('=')[1];
    const password = document.cookie.split('; ').find(row => row.startsWith('password=')).split('=')[1];

    fetch(import.meta.env.VITE_API_URL + "/verify_credentials", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Display the edit tunnel form
            document.getElementById('edit-tunnel-form').style.display = 'block';
        } else {
            alert('驗證失敗，請重新登入。');
            router.push("/login");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('驗證失敗，請重新登入。');
            router.push("/login");
    });
});

// 快速創建功能
const quickCreateServices = ref([]);
const quickCreateSelectedService = ref(null);
const quickCreateSelectedNode = ref(null);
// let quickCreateServices = [];
// let quickCreateSelectedService = null;
// let quickCreateSelectedNode = null;

async function fetchQuickCreateServices() {
    const response = await fetch(import.meta.env.VITE_API_URL + "/quickcreate.json");
    if (response.ok) {
        const data = await response.json();
        quickCreateServices = data.services;
        return quickCreateServices;
    } else {
        alert('無法讀取 quickcreate.json');
        return [];
    }
}

function showQuickCreateModal(content) {
    const modal = document.getElementById('quickcreate-modal');
    modal.innerHTML = content;
    modal.style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function hideQuickCreateModal() {
    document.getElementById('quickcreate-modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function showQuickCreateServiceSelect() {
    let html = '<h3>選擇服務</h3><select id="quickcreate-service-select">';
    quickCreateServices.forEach((svc, idx) => {
        html += `<option value="${idx}">${svc.name}</option>`;
    });
    html += '</select>';
    html += '<div style="margin-top:10px;"><button onclick="quickCreateSelectService()">下一步</button> <button onclick="hideQuickCreateModal()">取消</button></div>';
    showQuickCreateModal(html);
}

async function handleQuickCreate() {
    // 1. 先檢查可創建/已創建
    const username = document.cookie.split('; ').find(row => row.startsWith('username='))?.split('=')[1] || document.cookie.split('; ').find(row => row.startsWith('adminchanguser='))?.split('=')[1];
    const password = document.cookie.split('; ').find(row => row.startsWith('password='))?.split('=')[1];
    const verificationCode = document.cookie.split('; ').find(row => row.startsWith('admin_verification_code='))?.split('=')[1];

    try {
        const response = await fetch(import.meta.env.VITE_API_URL + "/check_proxy_limit", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, verificationCode })
        });
        if (response.ok) {
            const data = await response.json();
            const remainingProxies = parseInt(data.remainingProxies, 10);
            if (tunnels.length >= remainingProxies) {
                showQuickCreateModal('<p>已達到代理數量上限，請刪除一個代理後再創建。</p><button onclick="hideQuickCreateModal()">確定</button>');
                return;
            }
        } else {
            showQuickCreateModal('<p>無法獲取代理數量限制</p><button onclick="hideQuickCreateModal()">確定</button>');
            return;
        }
    } catch (e) {
        showQuickCreateModal('<p>檢查代理數量時發生錯誤</p><button onclick="hideQuickCreateModal()">確定</button>');
        return;
    }
    // 2. 讀 quickcreate.json 並顯示服務選擇
    const services = await fetchQuickCreateServices();
    if (!services.length) return;
    showQuickCreateServiceSelect();
}

window.quickCreateSelectService = function() {
    const idx = document.getElementById('quickcreate-service-select').value;
    quickCreateSelectedService = quickCreateServices[idx];
    // 顯示節點選擇，預設為未選擇
    let html = `<h3>選擇節點</h3><select id="quickcreate-node-select">`;
    html += '<option value="" disabled selected>未選擇</option>';
    nodes.forEach((node, nidx) => {
        html += `<option value="${nidx}">${node.name}</option>`;
    });
    html += '</select>';
    html += '<div style="margin-top:10px;"><button onclick="quickCreateSelectNode()">下一步</button> <button onclick="hideQuickCreateModal()">取消</button></div>';
    showQuickCreateModal(html);
}

window.quickCreateSelectNode = function() {
    const nidx = document.getElementById('quickcreate-node-select').value;
    if (nidx === "" || nidx === null || nidx === undefined) {
        showQuickCreateModal('<p>請選擇節點！</p><button onclick="showQuickCreateServiceSelect()">返回</button>');
        return;
    }
    quickCreateSelectedNode = nodes[nidx];
    quickCreateDoCreate();
}

function randomString(len) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let i = 0; i < len; i++) str += chars[Math.floor(Math.random() * chars.length)];
    return str;
}

async function getRandomAvailablePort(node, tryCount = 0) {
    const [minPort, maxPort] = node.availablePorts.split('-').map(Number);
    const port = Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
    // 檢查端口是否被佔用
    const url = `https://taiwanfrp.ddns.net/check_port_usage?port=${port}&nodeName=${encodeURIComponent(node.name)}`;
    try {
        const resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            if (!data.occupied) return port;
        }
    } catch (e) {}
    if (tryCount > 20) throw new Error('找不到可用端口');
    return getRandomAvailablePort(node, tryCount + 1);
}

async function quickCreateDoCreate() {
    const service = quickCreateSelectedService;
    const node = quickCreateSelectedNode;
    if (!service || !node) return;
    // 服務名稱+3位亂碼
    const tunnelName = service.name + randomString(3);
    const localIp = '127.0.0.1';
    const localPort = Array.isArray(service.port) ? service.port[0] : service.port;
    let remotePort;
    try {
        remotePort = await getRandomAvailablePort(node);
    } catch (e) {
        showQuickCreateModal('<p>找不到可用端口，請稍後再試。</p><button onclick="hideQuickCreateModal()">確定</button>');
        return;
    }
    // 新增到tunnels
    const config = `type = tcp\nlocal_ip = ${localIp}\nlocal_port = ${localPort}\nremote_port = ${remotePort}\nprotocol = kcp\nbandwidth_limit = 3096KB`;
    tunnels.push({ name: tunnelName, config, node: node.name, enabled: true });
    hideQuickCreateModal();
    renderTunnels();
    await updateProxyCount();
    // 修改這裡：showMessage 不跳轉，僅顯示確定按鈕
    const messageBox = document.getElementById('message-box');
    const overlay = document.getElementById('overlay');
    messageBox.innerHTML = `<p>快速創建成功，請點擊保存！</p><button onclick=\"hideMessage()\">確定</button>`;
    messageBox.style.display = 'block';
    overlay.style.display = 'block';
    document.addEventListener('keydown', handleEnterKey);
}

function openDiscord() {
    window.open(import.meta.env.VITE_DISCORD_URL, "_blank");
}

function quickCreateButton() {
    return
}

</script>

<style scoped>
.error-message {
    color: red;
    font-size: 12px;
    margin-top: -10px;
    margin-bottom: 10px;
}

.button-group {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.button-group button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.button-group .delete-button {
    background-color: #e74c3c;
    color: white;
}

.button-group .add-button {
    background-color: #3498db;
    color: white;
}

.button-group .save-button {
    background-color: #2ecc71;
    color: white;
}

.button-group button:hover,
.button-group button:focus {
    opacity: 0.8;
}

.tunnel {
    background-color: #ccc;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
}

.tunnel .delete-button {
    background-color: #e74c3c;
    color: white;
    margin-top: 10px;
    padding: 10px 10px; /* Increase padding for larger button */
    font-size: 16px; /* Increase font size */
}

.tunnel .delete-button:hover,
.tunnel .delete-button:focus {
    opacity: 0.8;
}

.tunnel-status {
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
}

.tunnel-status-online {
    background-color: #d4edda;
    color: #155724;
}

.tunnel-status-offline {
    background-color: #f8d7da;
    color: #721c24;
}

.tunnel-status p {
    margin: 0;
}

.discord-status {
    /* display: none; */
    color: red;
    background-color: rgba(255, 0, 0, 0.1);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
    font-weight: bold;
}

.discord-status button {
    background-color: #ffbf00;
    color: #333;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: calc(10px + 0.5vw);
    margin-top: 10px;
}

.discord-status button:hover,
.discord-status button:focus {
    background-color: #e6ac00;
    color: white;
}

.proxy-toggle {
    position: relative;
    width: 50px;
    height: 25px;
    background-color: gray;
    border-radius: 15px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.proxy-toggle::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 21px;
    height: 21px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
}

.proxy-toggle.enabled {
    background-color: green;
}

.proxy-toggle.enabled::before {
    transform: translateX(25px);
}

.ip-tip-popup {
    display: none;
    position: absolute;
    top: -38px;
    left: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.85);
    color: #fff;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 14px;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    pointer-events: none;
}
</style>