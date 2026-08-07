import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AppProvider } from "./contexts/AppContext";
import { initAnalyticsIfConsented } from "./lib/firebase";
import { trackEvent } from "./lib/analytics";
import { reportPushOpenFromUrl } from "./lib/pushTracking";
import ActivityTracker from "./components/feature/ActivityTracker";
import GuestPetClaimer from "./components/feature/GuestPetClaimer";


function App() {
  useEffect(() => {
    initAnalyticsIfConsented().then(() => {
      trackEvent('app_opened');
      // Must run after analytics init, otherwise the event is a no-op and the
      // URL params get stripped before they can be reported.
      reportPushOpenFromUrl();
    });
    window.addEventListener('petvida:cookie-consent', initAnalyticsIfConsented);
    return () => window.removeEventListener('petvida:cookie-consent', initAnalyticsIfConsented);
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppProvider>
          <ActivityTracker />
          <GuestPetClaimer />
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
