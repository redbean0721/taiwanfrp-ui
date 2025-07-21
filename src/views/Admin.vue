<template>
    <header>
        <h1>管理員面板</h1>
        <div class="auth-buttons">
            <a href="index.html">返回主畫面</a>
        </div>
    </header>

    <section id="verification-section">
        <form onsubmit="verifyCode(event);">
            <label for="verificationCode">驗證碼:</label>
            <input type="text" id="verificationCode" name="verificationCode" required><br><br>
            <button type="submit">驗證</button>
        </form>
    </section>

    <section id="log-section" style="display: none;"> <!-- Moved above user section -->
        <h2>伺服器日誌</h2>
        <div id="log-container">正在連接到伺服器日誌...</div>
        <button id="shutdown-button" style="margin-top: 10px; background-color: red; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;">重新啟動伺服器</button>
    </section>

    <section id="user-section" style="display: none;">
        <h2>使用者列表</h2>
        <div id="user-container"></div>
    </section>

    <section id="nodes-section" style="display: none;">
        <h2>管理節點</h2>
        <div id="nodes-container"></div>
        <button onclick="showAddNodeForm()">新增節點</button>
    </section>

    <section id="betanodes-section" style="display: none;">
        <h2>管理測試伺服器 (betanodes.json)</h2>
        <div id="betanodes-container"></div>
    </section>

    <div id="betanode-form" style="display: none;">
        <h3 id="beta-form-title">新增測試節點</h3>
        <form onsubmit="submitBetaNodeForm(event)">
            <label>名稱: <input type="text" id="beta-node-name" required></label><br>
            <label>IP: <input type="text" id="beta-node-ip" required></label><br>
            <label>可用端口: <input type="text" id="beta-node-ports" required></label><br>
            <label>使用者 frpc.ini 文件夾: <input type="text" id="beta-node-frpc-folder" disabled></label><br>
            <label>端口佔用紀錄文件: <input type="text" id="beta-node-port-file" disabled></label><br>
            <label>紀錄端口文件 (不重要): <input type="text" id="beta-node-auth-file" disabled></label><br>
            <label>frps 驗證端點: <input type="text" id="beta-node-auth-endpoint" required></label><br>
            <button type="submit">保存</button>
            <button type="button" onclick="hideBetaNodeForm()">取消</button>
        </form>
    </div>

    <div id="overlay"></div>
    <div id="node-form">
        <h3 id="form-title">新增節點</h3>
        <form onsubmit="submitNodeForm(event)">
            <label>名稱: <input type="text" id="node-name" required></label><br>
            <label>IP: <input type="text" id="node-ip" required></label><br>
            <label>可用端口: <input type="text" id="node-ports" required></label><br>
            <label>使用者 frpc.ini 文件夾: <input type="text" id="node-frpc-folder" disabled></label><br>
            <label>端口佔用紀錄文件: <input type="text" id="node-port-file" disabled></label><br>
            <label>紀錄端口文件 (不重要): <input type="text" id="node-auth-file" disabled></label><br>
            <label>frps 驗證端點: <input type="text" id="node-auth-endpoint" required></label><br>
            <button type="submit">保存</button>
            <button type="button" onclick="hideNodeForm()">取消</button>
        </form>
    </div>
        <div id="message-box" class="message-box"></div>
    <div id="overlay" class="overlay"></div>
</template>

<style scoped>
.user {
    margin-bottom: 20px;
    background-color: #ccc;
    padding: 10px;
    border-radius: 5px;
}

.user h3 {
    color: black;
}

.user button {
    margin-right: 10px;
}

.editable {
    cursor: pointer;
    border: 1px dashed black;
    padding: 5px;
    border-radius: 5px;
    background-color: white;
    color: black;
}

.editable:focus {
    outline: none;
    border: 1px solid black;
}

#log-container {
    width: 95%;
    height: 300px;
    overflow-y: auto;
    background-color: black;
    color: #0f0;
    padding: 10px;
    border-radius: 8px;
    font-family: monospace;
    white-space: pre-wrap;
}

.ios-switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
}

.ios-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ff0000b7;
    transition: 0.4s;
    border-radius: 20px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #4caf50;
}

input:checked + .slider:before {
    transform: translateX(14px);
}

#node-form {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ccc;
    color: #000;
    padding: 20px;
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.5);
    z-index: 1001;
}

.node-container {
    border: 1px solid #432222;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
    background-color: rgba(255, 255, 255, 0.9)
}

#nodes-section {
    color: black;
}

#betanodes-section {
    color: black; /* Set text color to black */
}
</style>