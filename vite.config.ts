import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";

export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify("/"),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        {
          react: [
            ["default", "React"],
            "useState", "useEffect", "useContext", "useReducer",
            "useCallback", "useMemo", "useRef", "useId",
            "lazy", "memo", "forwardRef", "createContext",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate", "useLocation", "useParams", "useSearchParams",
            "Link", "NavLink", "Navigate", "Outlet",
          ],
        },
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
});
