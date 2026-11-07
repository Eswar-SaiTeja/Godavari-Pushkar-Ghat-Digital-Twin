/**
 * HUD Position Manager Service
 * Manages draggable panel positions, localStorage persistence, viewport clamping, and global layout resets.
 */

export interface HUDPanelState {
  x: number;
  y: number;
  isMinimized: boolean;
}

const STORAGE_KEY_PREFIX = 'godavari_hud_pos_';
export const GLOBAL_RESET_HUD_EVENT = 'godavari_reset_all_huds';

class HUDPositionManager {
  private highestZIndex = 25;

  /**
   * Acquire a higher z-index when a panel is clicked or dragged
   */
  public bringToFront(): number {
    this.highestZIndex += 1;
    return this.highestZIndex;
  }

  /**
   * Retrieve saved position or return default clamped to current viewport
   */
  public getPosition(panelId: string, defaultPos: { x: number; y: number }): HUDPanelState {
    if (typeof window === 'undefined') {
      return { ...defaultPos, isMinimized: false };
    }

    try {
      // Demo preset query support for visual verification
      if (window.location.search.includes('preset=repositioned')) {
        const presets: Record<string, HUDPanelState> = {
          telemetry_hud: { x: 120, y: 160, isMinimized: false },
          simulation_intelligence_hud: { x: Math.max(20, window.innerWidth - 460), y: 76, isMinimized: false },
          camera_hud: { x: 120, y: 270, isMinimized: false },
          simulation_toolbar: { x: Math.max(20, Math.floor((window.innerWidth - 880) / 2)), y: Math.max(80, window.innerHeight - 170), isMinimized: false },
          location_info_panel: { x: Math.max(20, window.innerWidth - 420), y: 220, isMinimized: false },
        };
        if (presets[panelId]) return presets[panelId];
      }

      if (window.location.search.includes('preset=minimized')) {
        const presets: Record<string, HUDPanelState> = {
          telemetry_hud: { x: 80, y: 80, isMinimized: true },
          simulation_intelligence_hud: { x: Math.max(20, window.innerWidth - 380), y: 80, isMinimized: true },
          camera_hud: { x: 80, y: 130, isMinimized: true },
          simulation_toolbar: { x: Math.max(20, Math.floor((window.innerWidth - 500) / 2)), y: Math.max(80, window.innerHeight - 60), isMinimized: true },
          location_info_panel: { x: Math.max(20, window.innerWidth - 320), y: 140, isMinimized: true },
        };
        if (presets[panelId]) return presets[panelId];
      }

      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${panelId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Clamp inside current window dimensions
          const maxX = Math.max(0, window.innerWidth - 60);
          const maxY = Math.max(64, window.innerHeight - 50);
          const clampedX = Math.max(0, Math.min(maxX, parsed.x));
          const clampedY = Math.max(64, Math.min(maxY, parsed.y));

          return {
            x: clampedX,
            y: clampedY,
            isMinimized: !!parsed.isMinimized,
          };
        }
      }
    } catch (err) {
      console.warn(`[HUDPositionManager] Failed to read stored position for ${panelId}:`, err);
    }

    return { ...defaultPos, isMinimized: false };
  }

  /**
   * Save panel position and minimize state to localStorage
   */
  public savePosition(panelId: string, state: HUDPanelState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${panelId}`, JSON.stringify(state));
    } catch (err) {
      console.warn(`[HUDPositionManager] Failed to persist position for ${panelId}:`, err);
    }
  }

  /**
   * Reset single panel position
   */
  public resetPosition(panelId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${panelId}`);
    } catch (_) {}
  }

  /**
   * Global Reset for all HUD panels across the application
   */
  public resetAllPositions(): void {
    if (typeof window === 'undefined') return;
    try {
      const knownPanels = [
        'telemetry_hud',
        'simulation_intelligence_hud',
        'camera_hud',
        'simulation_toolbar',
      ];

      knownPanels.forEach(id => {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
      });

      window.dispatchEvent(new CustomEvent(GLOBAL_RESET_HUD_EVENT));
    } catch (err) {
      console.warn('[HUDPositionManager] Error resetting HUD positions:', err);
    }
  }

  /**
   * Subscribe to global HUD reset events
   */
  public subscribeToGlobalReset(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(GLOBAL_RESET_HUD_EVENT, handler);
    return () => window.removeEventListener(GLOBAL_RESET_HUD_EVENT, handler);
  }
}

export const hudPositionManager = new HUDPositionManager();
