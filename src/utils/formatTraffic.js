export function formatTraffic(bytes) {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let i = 0;
	let value = bytes;

	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}

	return value.toFixed(2) + ' ' + units[i];
}