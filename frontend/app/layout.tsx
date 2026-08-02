import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Insulin Resistance Predictor",
  description: "Next.js interface for a FastAPI logistic regression model.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
