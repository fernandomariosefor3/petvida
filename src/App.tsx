import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AppProvider } from "./contexts/AppContext";
import { initAnalyticsIfConsented } from "./lib/firebase";
import { trackEvent } from "./lib/analytics";


function App() {
  useEffect(() => {
    initAnalyticsIfConsented().then(() => trackEvent('app_opened'));
    window.addEventListener('petvida:cookie-consent', initAnalyticsIfConsented);
    return () => window.removeEventListener('petvida:cookie-consent', initAnalyticsIfConsented);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
