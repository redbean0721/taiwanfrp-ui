<template>
    <div id="intro-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); z-index: 1000; color: #fff; text-align: center; padding: 20px; overflow-y: auto;">
        <div style="background: #fff; color: #000; padding: 20px; border-radius: 8px; max-width: 600px; width: 90%; margin: 50px auto; text-align: left;">
            <h2>歡迎使用 TAIWANFRP 節點申請服務</h2>
            <p>1. 這是一項免費服務，節點提供者無法從中獲得金錢收益，但可以一起做公益，幫助有需要的人。</p>
            <p>2. TAIWANFRP 僅支持 <strong>0.48.0</strong> 版本的 frp 服務端，請勿下載錯誤的版本。</p>
            <p>3. 請確保節點穩定運行，以確保使用者不會流失。</p>
            <p>4. 等會將生成一個 <strong>frps.ini</strong> 設定文件，請下載對應您電腦的 frps 0.48.0 服務端。</p>
            <p>5. 下一步，解壓縮下載的檔案，並把解壓縮文件夾中的frps放置於一個文件夾中。</p>
            <p>6. 將 <strong>frps.ini</strong> 放置於 frps 服務端的同一文件夾，並開始執行。</p>
            <p>7. 請確保在路由器上開啟您轉發的端口的tcp/udp和7500 tcp/udp跟7000 tcp/udp。</p>
            <button onclick="closeIntroModal()" style="background-color: #333; color: #ffbf00; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">我已了解並同意</button>
        </div>
    </div>
    <header>
        <h1>成為TAIWANFRP節點合作夥伴</h1>
        <div class="auth-buttons">
            <a href="index.html">返回主畫面</a>
        </div>
    </header>
    <section>
        <form onsubmit="applyNode(event);">
            <label for="node-name">節點名稱:</label>
            <input type="text" id="node-name" name="node-name" required>
            <label for="node-ip">節點 IP:</label>
            <input type="text" id="node-ip" name="node-ip" required placeholder="例如: 192.168.1.1">
            <label for="node-ports">節點端口:</label>
            <div class="input-group">
                <input type="number" id="node-ports-start" name="node-ports-start" required placeholder="起始端口">
                <input type="number" id="node-ports-end" name="node-ports-end" required placeholder="結束端口">
            </div>
            <label for="node-alias">節點英文暱稱 (提示: 申請後無法修改):</label>
            <input type="text" id="node-alias" name="node-alias" required placeholder="僅限英文和數字">
            <button type="submit">提交申請</button>
        </form>
    </section>
    <section id="node-section">
        <h2>已審核節點</h2>
        <div id="approved-nodes" style="margin-bottom: 20px;">
            <!-- Approved nodes will be dynamically inserted here -->
        </div>
        <h2>待審核節點</h2>
        <div id="pending-nodes">
            <!-- Pending nodes will be dynamically inserted here -->
        </div>
    </section>
    <div id="overlay"></div>
    <div id="success-popup">
        <h2>節點申請成功</h2>
        <p>
            下一步，下載 frps 節點 網址:
            <a href="https://github.com/fatedier/frp/releases/tag/v0.63.0" target="_blank" onclick="handleDownloadClick()">https://github.com/fatedier/frp/releases/tag/v0.63.0</a>。
        </p>
        <button onclick="closePopup()">關閉</button>
    </div>
    <div id="frps-popup" style="display: none;">
        <div style="background: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 8px; text-align: center; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1001; width: 95%; max-width: 600px; overflow-y: auto !important; max-height: 80vh !important;">
            <h2>frps.ini 預覽</h2>
            <pre id="frps-content" style="background: #333; color: #ffbf00; padding: 10px; border-radius: 4px; text-align: left; overflow-x: auto;"></pre>
            <a id="download-link" download="frps.ini" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #333; color: #ffbf00; text-decoration: none; border-radius: 4px;">下載 frps.ini</a>
            <p>將下載的 <strong>frps.ini</strong> 放入從 <a href="https://github.com/fatedier/frp/releases/tag/v0.48.0" target="_blank">frp 0.48.0</a> 下載的 frps 同一個文件夾。</p>
            <p>接下來執行 <strong>frps</strong>，執行之後點擊 <strong>開始自動審核</strong>。</p>
            <button onclick="closeFrpsPopup()" style="margin-top: 10px; padding: 10px 20px; background-color: #333; color: #ffbf00; border: none; border-radius: 4px; cursor: pointer;">關閉</button>
        </div>
        <div id="frps-overlay" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1000;"></div>
    </div>
    <div id="edit-overlay"></div>
    <div id="edit-popup">
        <h2>編輯節點</h2>
        <form onsubmit="saveNodeChanges(event);">
            <label for="edit-node-name">節點名稱:</label>
            <input type="text" id="edit-node-name" disabled>
            <label for="edit-node-ip">節點 IP:</label>
            <input type="text" id="edit-node-ip" required>
            <label for="edit-node-ports">節點端口:</label>
            <div class="input-group">
                <input type="number" id="edit-node-ports-start" required placeholder="起始端口">
                <input type="number" id="edit-node-ports-end" required placeholder="結束端口">
            </div>
            <label for="edit-node-owner">擁有者:</label>
            <input type="text" id="edit-node-owner" disabled>
            <label for="edit-node-alias">節點英文暱稱:</label>
            <input type="text" id="edit-node-alias" disabled>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button type="submit" style="flex: 1;">保存</button>
                <button type="button" onclick="closeEditPopup()" style="flex: 1;">取消</button>
            </div>
        </form>
    </div>
</template>

<style>
header {
    color: black; /* 修改文字顏色為黑色 */
    padding-top: 60px;
    animation: fadeIn 1s ease-in-out;
}

form label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: black; /* 修改文字顏色為黑色 */
}

form input, form button {
    width: 95%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

form button {
    background-color: #333;
    color: #ffbf00;
    border: none;
    cursor: pointer;
    display: block; /* Make the button a block element */
    margin: 0 auto; /* Center the button horizontally */
}

form button:hover {
    background-color: #555;
}

section {
    max-width: 600px;
    margin: 20px auto;
}

#success-popup {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    color: black; /* 修改文字顏色為黑色 */
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    text-align: center;
}

#success-popup button {
    margin-top: 10px;
    padding: 10px 20px;
    background-color: #333;
    color: #ffbf00;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

#success-popup button:hover {
    background-color: #555;
}

#overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
}
    /* 修改 frps.ini 預覽區域的樣式 */
#frps-content {
background: black; /* 設定背景為黑色 */
color: #ffbf00; /* 設定文字顏色為黃色 */
padding: 10px;
border-radius: 4px;
text-align: left;
overflow-x: auto;
overflow-y: auto !important; /* Allow vertical scrolling */
max-height: 80vh !important; /* Limit height to 80% of the viewport */
}

form input:invalid {
    border-color: red;
}

form input:valid {
    border-color: green;
}

form .input-group {
    display: flex;
    gap: 10px;
}

form .input-group input {
    flex: 1;
}

#edit-popup {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    z-index: 1001;
    width: 80%;
    max-width: 600px;
}

#edit-popup input[disabled] {
    background-color: #f5f5f5;
    color: #999;
    cursor: not-allowed;
}

#edit-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
}
</style>