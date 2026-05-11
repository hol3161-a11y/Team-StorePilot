import "./reset.css";
import "./globals.css";
import Providers from "@/components/Providers"; // 👈 추가

export const metadata = {
  title: {
    template: "%s | StorePilot",    // 각 페이지 제목 + " | StorePilot"
    default: "StorePilot",          // title 없는 페이지 fallback
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
