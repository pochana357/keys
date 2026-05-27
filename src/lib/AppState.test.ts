import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pushState, replaceState } from '$app/navigation';
import {
  AppState,
  applyCurrentPageState,
  currentPageFromSearch,
  currentPageToSearch,
  updateCurrentPageUrl,
  type ExportSelections,
  type currentPage,
} from './AppState';

vi.mock('$app/navigation', () => ({
  pushState: vi.fn(),
  replaceState: vi.fn(),
}));

const page = (overrides: Partial<currentPage> = {}): currentPage => ({
  code: 'abc',
  fightIdx: 1,
  dungeonPullIdx: 2,
  ...overrides,
});

describe('current page URL state', () => {
  beforeEach(() => {
    vi.mocked(pushState).mockClear();
    vi.mocked(replaceState).mockClear();
  });

  it('serializes the current page query in the expected format', () => {
    expect(currentPageToSearch(page())).toBe('?code=abc&fight=1&pull=2');
  });

  it('parses the current page query from a URL search string', () => {
    expect(currentPageFromSearch('?code=abc&fight=1&pull=2')).toEqual(page());
  });

  it('defaults missing or invalid page indices to -1', () => {
    expect(currentPageFromSearch('?code=abc&fight=nope')).toEqual(
      page({ fightIdx: -1, dungeonPullIdx: -1 }),
    );
  });

  it('updates all current page fields together', () => {
    const target = page({ code: '', fightIdx: -1, dungeonPullIdx: -1 });

    applyCurrentPageState(target, page());

    expect(target).toEqual(page());
  });

  it('pushes one history entry for user actions', () => {
    updateCurrentPageUrl(page(), 'push', '');

    expect(pushState).toHaveBeenCalledOnce();
    expect(pushState).toHaveBeenCalledWith('?code=abc&fight=1&pull=2', {});
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('replaces history for initial restores', () => {
    updateCurrentPageUrl(page(), 'replace', '');

    expect(replaceState).toHaveBeenCalledOnce();
    expect(replaceState).toHaveBeenCalledWith('?code=abc&fight=1&pull=2', {});
    expect(pushState).not.toHaveBeenCalled();
  });

  it('can update state without navigating', () => {
    updateCurrentPageUrl(page(), 'none', '');

    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('does not navigate when the requested URL is already current', () => {
    const currentSearch = currentPageToSearch(page());

    updateCurrentPageUrl(page(), 'push', currentSearch);

    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe('export selection validation', () => {
  it('sanitizes persisted spell-id arrays', () => {
    expect(
      AppState.validateSpellIdArray([456, 123, 123, -1, 0, 1.5, 'x']),
    ).toEqual([123, 456]);
    expect(AppState.validateSpellIdArray('not-array')).toEqual([]);
  });

  it('validates persisted export selection state', () => {
    const state = {
      damageSpellIds: [2, 1, 1, Number.NaN],
      defensiveSpellIds: ['x', 3, 3, 4],
      defensiveDefaultsInitialized: 'yes',
    } as unknown as ExportSelections;

    AppState.validateExportSelections(state);

    expect(state).toEqual({
      damageSpellIds: [1, 2],
      defensiveSpellIds: [3, 4],
      defensiveDefaultsInitialized: false,
    });
  });
});
