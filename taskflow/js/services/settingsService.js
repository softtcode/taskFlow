/*
  settingsService.js — preferências do usuário (tema, cor, formatos...).
  Salvas no localStorage a cada mudança, por isso sobrevivem ao recarregar a página.
*/
import { DEFAULT_SETTINGS } from '../config/constants.js';
import { readJSON, writeJSON } from '../utils/storage.js';
import { bus, EVENTS } from '../core/eventBus.js';

const KEY = 'settings';

function load() {
  const stored = readJSON(KEY, {});
  // Mesclar com o padrão garante que novas opções adicionadas no futuro tenham valor.
  return { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) };
}

let settings = load();

export const getSettings = () => settings;

/** Atualiza uma ou mais preferências: updateSettings({ theme: 'dark' }) */
export function updateSettings(patch) {
  settings = { ...settings, ...patch };
  try {
    writeJSON(KEY, settings);
  } catch (error) {
    console.warn('Não foi possível salvar as configurações.', error);
  }
  bus.emit(EVENTS.SETTINGS_CHANGED, { settings, patch });
}

export function resetSettings() {
  updateSettings({ ...DEFAULT_SETTINGS });
}
