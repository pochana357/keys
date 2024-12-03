import { browser } from '$app/environment';
export default function createAsyncStatus(defaultValue_?: string, tmpTime_?: number) {
	const defaultValue = defaultValue_ ?? '';
	const tmpTime = tmpTime_ ?? 1500;

	let value = $state(defaultValue);
	let timeoutHandle: ReturnType<typeof globalThis.setTimeout> | null = null;

	const clearTimeout = () => {
		if (browser && timeoutHandle) globalThis.clearTimeout(timeoutHandle);
	};
	const setTemporary = (tmpValue: string, laterValue_?: string) => {
		const laterValue = laterValue_ ?? defaultValue;
		clearTimeout();
		value = tmpValue;
		if (browser)
			timeoutHandle = setTimeout(() => {
				value = laterValue;
			}, tmpTime);
	};

	return {
		get value() {
			return value;
		},
		set value(x) {
			clearTimeout();
			value = x;
		},
		clearTimeout,
		setTemporary
	};
}
