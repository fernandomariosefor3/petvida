import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { AppProvider } from "./contexts/AppContext";


function App() {
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
