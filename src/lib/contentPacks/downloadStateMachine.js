/** @typedef {'idle'|'downloading'|'paused'|'verifying'|'installed'|'error'} PackDownloadStatus */

/**
 * @typedef {object} PackDownloadState
 * @property {PackDownloadStatus} status
 * @property {string|null} packId
 * @property {number} bytesLoaded
 * @property {number} bytesTotal
 * @property {string|null} error
 * @property {number} attempt
 */

export function createInitialPackDownloadState() {
  return {
    status: 'idle',
    packId: null,
    bytesLoaded: 0,
    bytesTotal: 0,
    error: null,
    attempt: 0,
  };
}

/**
 * @param {PackDownloadState} state
 * @param {{ type: string, packId?: string, bytesLoaded?: number, bytesTotal?: number, error?: string }} event
 */
export function transitionPackDownload(state, event) {
  const next = { ...state };
  switch (event.type) {
    case 'START':
      return {
        status: 'downloading',
        packId: String(event.packId || ''),
        bytesLoaded: 0,
        bytesTotal: Number(event.bytesTotal) || 0,
        error: null,
        attempt: (state.attempt || 0) + 1,
      };
    case 'PROGRESS':
      if (state.status !== 'downloading' && state.status !== 'paused') return state;
      return {
        ...state,
        bytesLoaded: Number(event.bytesLoaded) || 0,
        bytesTotal: Number(event.bytesTotal) || state.bytesTotal,
      };
    case 'PAUSE':
      if (state.status !== 'downloading') return state;
      return { ...state, status: 'paused' };
    case 'RESUME':
      if (state.status !== 'paused') return state;
      return { ...state, status: 'downloading' };
    case 'VERIFY':
      return { ...state, status: 'verifying' };
    case 'COMPLETE':
      return {
        ...state,
        status: 'installed',
        bytesLoaded: state.bytesTotal || state.bytesLoaded,
        error: null,
      };
    case 'FAIL':
      return {
        ...state,
        status: 'error',
        error: String(event.error || 'download-failed'),
      };
    case 'RETRY':
      if (!state.packId) return createInitialPackDownloadState();
      return {
        ...state,
        status: 'downloading',
        error: null,
        bytesLoaded: 0,
        attempt: (state.attempt || 0) + 1,
      };
    case 'RESET':
      return createInitialPackDownloadState();
    default:
      return state;
  }
}

export function aggregateDownloadProgress(statesByPackId) {
  let loaded = 0;
  let total = 0;
  let anyActive = false;
  Object.values(statesByPackId || {}).forEach((row) => {
    if (!row) return;
    if (row.status === 'downloading' || row.status === 'verifying') anyActive = true;
    loaded += Number(row.bytesLoaded) || 0;
    total += Number(row.bytesTotal) || 0;
  });
  const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  return { loaded, total, percent, anyActive };
}
