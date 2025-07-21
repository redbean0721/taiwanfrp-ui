import { formatTraffic } from '../utils/formatTraffic';

export async function fetchTaiwanFRPStatus() {
	try {
		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/aggregate_serverinfo`)
		if (!response.ok) {
			console.error('Failed to fetch TaiwanFRP status')
			return null
		}
		return await response.json()
	} catch (error) {
		console.error('Error fetching TaiwanFRP status:', error)
		return null
	}
}

export async function renderTaiwanFRPStatus() {
	const statusData = await fetchTaiwanFRPStatus()
	if (!statusData) return

	const statusHtml = `
		<div class="server-status-container">
			<h3>TAIWANFRP 總量統計</h3>
			<p><strong>在線客戶端總量:</strong> ${statusData.total_client_counts}</p>
			<p><strong>建立連接總量:</strong> ${statusData.total_cur_conns}</p>
			<p><strong>今日總流量:</strong> 入網 ${formatTraffic(statusData.total_traffic_in)} / 出網 ${formatTraffic(statusData.total_traffic_out)}</p>
			<p><strong>TCP 代理總數:</strong> ${statusData.total_tcp}</p>
			<p><strong>UDP 代理總數:</strong> ${statusData.total_udp}</p>
		</div>
	`

	const serverStatusDiv = document.getElementById('taiwanfrp-status')
	if (serverStatusDiv) {
		serverStatusDiv.innerHTML = statusHtml
	}
}