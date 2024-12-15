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

export function getVersPercent(rating: number) {
	const percent2Rating = 780; // @ Level 80
	const preDR = rating / percent2Rating;
	if (preDR <= 30.0) return preDR;
	else if (preDR <= 40.0) return 30.0 + (preDR - 30.0) * 0.9;
	else if (preDR <= 50.0) return 39.0 + (preDR - 40.0) * 0.8;
	else if (preDR <= 60.0) return 47.0 + (preDR - 50.0) * 0.7;
	else if (preDR <= 80.0) return 54.0 + (preDR - 60.0) * 0.6;
	else if (preDR <= 200.0) return 66.0 + (preDR - 80.0) * 0.5;
	if (preDR >= 200) return 126.0;
}

export function formatInteger(x: number) {
	return x.toLocaleString('en-US');
}
