import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const modules = import.meta.glob('./*/*.ts', { eager: true });

const resources: Record<string, { translation: Record<string, string> }> = {};

Object.keys(modules).forEach((path) => {
  const match = path.match(/\.\/([^/]+)\/([^/]+)\.ts$/);
  if (match) {
    const [, lang] = match;
    const module = modules[path] as { default?: Record<string, string> };

    if (!resources[lang]) {
      resources[lang] = { translation: {} };
    }

    if (module.default) {
      resources[lang].translation = {
        ...resources[lang].translation,
        ...module.default,
      };
    }
  }
});

// Initialized once here (this module is only ever evaluated once, per the
// ES module spec) and imported at the app's entry point (main.tsx), before
// <App> renders and passes this instance to <I18nextProvider>.
i18next.use(initReactI18next).init({
  resources,
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

export default i18next;