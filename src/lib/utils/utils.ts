export function formatTime(timestamp: number, referenceTimestamp: number = 0, digits: number = 3) {
	const seconds = (timestamp - referenceTimestamp) / 1000.0;
	const minutes = Math.floor(seconds / 60);
	const remainder = seconds - minutes * 60;
	const secondsStr = String(remainder.toFixed(digits)).padStart(
		2 + digits + (digits > 0 ? 1 : 0),
		'0'
	);
	return `${minutes}:${secondsStr}`;
}

export function formatAbsoluteTime(timestamp: number) {
	// from a UNIX timestamp to local time
	const date = new Date(timestamp);
	return date.toLocaleString();
}

export function hexToRGB(hex: string) {
	// input: string '#RRGGBB'
	try {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);

		return `rgb(${r}, ${g}, ${b})`;
	} catch {
		return 'rgb(128, 128, 128)';
	}
}
