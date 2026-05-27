import {
  createEphemeralState,
  createLocalStorageState,
  createSettings,
} from '$lib/localStorageWrapper.svelte';
import { setContext, getContext } from 'svelte';
import type Log from './api/Log.svelte';
import { browser } from '$app/environment';
import { pushState, replaceState } from '$app/navigation';

export const OReferenceTime = { dungeon: 'dungeon', pull: 'pull' } as const;
export type ReferenceTime =
  (typeof OReferenceTime)[keyof typeof OReferenceTime];

export type Settings = {
  pxPerSec: number;
  horizontalOverlap: number;
  pxPerLevel: number;
  showMinor: boolean;
  showReceived: boolean;
  pullStartAsReferenceTime: boolean;
  damageGroupInterval: number;
  wclApiKey: string;
};
const defaultSettings: Settings = {
  pxPerSec: 10.0,
  horizontalOverlap: 15.0, // in pixel
  pxPerLevel: 20.0,
  showMinor: false,
  showReceived: true,
  pullStartAsReferenceTime: true,
  damageGroupInterval: 3000,
  wclApiKey: '',
};
export type ExportSelections = {
  damageSpellIds: number[];
  defensiveSpellIds: number[];
  defensiveDefaultsInitialized: boolean;
};
const defaultExportSelections: ExportSelections = {
  damageSpellIds: [],
  defensiveSpellIds: [],
  defensiveDefaultsInitialized: false,
};
export type Range = {
  min: number;
  max: number;
};
export const settingsRange: { [name: string]: Range } = {
  pxPerSec: { min: 5.0, max: 20.0 },
  horizontalOverlap: { min: 1.0, max: 25.0 },
  pxPerLevel: { min: 15.0, max: 25.0 },
  damageGroupInterval: { min: 0, max: 5000 },
};
type HistoryItem = {
  code: string;
  timestamp: number;
  exportedCharacters: string[];
};

const defaultCurrentPage = {
  code: '',
  fightIdx: -1,
  dungeonPullIdx: -1,
};
export type currentPage = typeof defaultCurrentPage;
export type UrlUpdateMode = 'push' | 'replace' | 'none';
type Navigation = {
  pushState: typeof pushState;
  replaceState: typeof replaceState;
};

const defaultHistory: { items: HistoryItem[] } = { items: [] };

export const OApiStatus = {
  busy: 'busy',
  failed: 'failed',
  succeeded: 'succeeded',
} as const;
type ApiStatus = (typeof OApiStatus)[keyof typeof OApiStatus];
const maxHistory = 10;
const defaultApiStatus: { status: ApiStatus; invalidApiKey: boolean } = {
  status: OApiStatus.succeeded,
  invalidApiKey: false,
};

const defaultVisibility = {
  history: false,
  settings: false,
  outline: true,
  export: false,
};
export type Visibility = typeof defaultVisibility;

export function currentPageToSearch(currentPage: currentPage) {
  const urlParams = new URLSearchParams();
  urlParams.set('code', currentPage.code);
  urlParams.set('fight', currentPage.fightIdx.toString());
  urlParams.set('pull', currentPage.dungeonPullIdx.toString());
  return `?${urlParams.toString()}`;
}

function toNumber(s: string | null) {
  if (!s) return -1;
  const n = parseInt(s);
  return isNaN(n) ? -1 : n;
}

export function currentPageFromSearch(search: string): currentPage {
  const urlParams = new URLSearchParams(search);
  return {
    code: urlParams.get('code') ?? '',
    fightIdx: toNumber(urlParams.get('fight')),
    dungeonPullIdx: toNumber(urlParams.get('pull')),
  };
}

export function applyCurrentPageState(target: currentPage, next: currentPage) {
  target.code = next.code;
  target.fightIdx = next.fightIdx;
  target.dungeonPullIdx = next.dungeonPullIdx;
}

export function updateCurrentPageUrl(
  next: currentPage,
  mode: UrlUpdateMode,
  currentSearch: string,
  navigation: Navigation = { pushState, replaceState },
) {
  const nextSearch = currentPageToSearch(next);
  // Back/forward restores use `none`, and identical URLs should not create duplicate entries.
  if (mode === 'none' || nextSearch === currentSearch) return nextSearch;
  if (mode === 'replace') {
    navigation.replaceState(nextSearch, {});
  } else {
    navigation.pushState(nextSearch, {});
  }
  return nextSearch;
}
export class AppState {
  settings = createSettings(defaultSettings);
  history = createSettings(defaultHistory);
  api = createEphemeralState(defaultApiStatus);
  #currentPage = createSettings(defaultCurrentPage);
  visibility = createSettings(defaultVisibility);
  exportSelections = createLocalStorageState(
    defaultExportSelections,
    'exportSelections',
  );
  urlParams: URLSearchParams = new URLSearchParams();

  static defaultSettings = defaultSettings;
  static defaultCurrentPage = defaultCurrentPage;
  static defaultHistory = defaultHistory;
  static defaultExportSelections = defaultExportSelections;

  constructor() {
    setContext('appSettings', this);
  }

  get code() {
    return this.#currentPage.code;
  }
  get fightIdx() {
    return this.#currentPage.fightIdx;
  }
  get dungeonPullIdx() {
    return this.#currentPage.dungeonPullIdx;
  }
  set code(code: string) {
    this.#currentPage.code = code;
    this.urlParams.set('code', code);
  }
  set fightIdx(fightIdx: number) {
    this.#currentPage.fightIdx = fightIdx;
    this.urlParams.set('fight', fightIdx.toString());
  }
  set dungeonPullIdx(dungeonPullIdx: number) {
    this.#currentPage.dungeonPullIdx = dungeonPullIdx;
    this.urlParams.set('pull', dungeonPullIdx.toString());
  }
  // Keep current-page state and the URL in sync as one operation so a submit or pull
  // selection creates a single browser history entry instead of one per field.
  setCurrentPage(next: currentPage, mode: UrlUpdateMode = 'push') {
    applyCurrentPageState(this.#currentPage, next);
    this.urlParams = new URLSearchParams(currentPageToSearch(next));
    if (browser) updateCurrentPageUrl(next, mode, window.location.search);
  }

  resetSettings() {
    this.settings = createSettings(defaultSettings);
  }
  static validateNumber(value: unknown, range: Range, defaultValue: number) {
    if (typeof value !== 'number' || isNaN(value)) return defaultValue;
    if (value < range.min) return range.min;
    if (value > range.max) return range.max;
    return value;
  }
  static validateBoolean(value: unknown, defaultValue: boolean) {
    if (typeof value !== 'boolean') return defaultValue;
    return value;
  }
  static validateString(value: unknown, defaultValue: string) {
    if (typeof value !== 'string') return defaultValue;
    return value;
  }
  static validateSpellIdArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return [
      ...new Set(
        value.filter(
          (item): item is number =>
            typeof item === 'number' && Number.isInteger(item) && item > 0,
        ),
      ),
    ].toSorted((a, b) => a - b);
  }
  static validateExportSelections(exportSelections: ExportSelections) {
    exportSelections.damageSpellIds = AppState.validateSpellIdArray(
      exportSelections.damageSpellIds,
    );
    exportSelections.defensiveSpellIds = AppState.validateSpellIdArray(
      exportSelections.defensiveSpellIds,
    );
    exportSelections.defensiveDefaultsInitialized = AppState.validateBoolean(
      exportSelections.defensiveDefaultsInitialized,
      defaultExportSelections.defensiveDefaultsInitialized,
    );
  }
  validateSettings() {
    // This function is called when the app is loaded
    const settings = this.settings;
    settings.pxPerSec = AppState.validateNumber(
      settings.pxPerSec,
      settingsRange.pxPerSec,
      defaultSettings.pxPerSec,
    );
    settings.horizontalOverlap = AppState.validateNumber(
      settings.horizontalOverlap,
      settingsRange.horizontalOverlap,
      defaultSettings.horizontalOverlap,
    );
    settings.pxPerLevel = AppState.validateNumber(
      settings.pxPerLevel,
      settingsRange.pxPerLevel,
      defaultSettings.pxPerLevel,
    );
    settings.damageGroupInterval = AppState.validateNumber(
      settings.damageGroupInterval,
      settingsRange.damageGroupInterval,
      defaultSettings.damageGroupInterval,
    );
    settings.showReceived = AppState.validateBoolean(
      settings.showReceived,
      defaultSettings.showReceived,
    );
    settings.showMinor = AppState.validateBoolean(
      settings.showMinor,
      defaultSettings.showMinor,
    );
    settings.pullStartAsReferenceTime = AppState.validateBoolean(
      settings.pullStartAsReferenceTime,
      defaultSettings.pullStartAsReferenceTime,
    );
    settings.wclApiKey = AppState.validateString(
      settings.wclApiKey,
      defaultSettings.wclApiKey,
    );
    AppState.validateExportSelections(this.exportSelections);
  }

  pushCodeToHistory(log: Log) {
    if (!log?.code) return;
    const newCode = {
      code: log.code,
      timestamp: log.fights.json?.start || 0,
      exportedCharacters: log.exportedCharacters,
    };
    const newItems = this.history.items.filter(
      (item) => item.code !== log.code,
    );
    newItems.push(newCode);
    this.history.items =
      newItems.length <= maxHistory ? newItems : newItems.slice(1);
  }
  clearHistory() {
    this.history.items = [this.history.items[this.history.items.length - 1]];
  }
  isBusy() {
    return this.api.status === OApiStatus.busy;
  }
}
export function getAppState() {
  return getContext('appSettings') as AppState;
}
