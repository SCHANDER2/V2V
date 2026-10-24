import React from "react";
import "./globals.css";

export const metadata = {
  title: "Raktkhoj • Become a donor, Save lives",
  description: "India's voluntary blood donor network & 24x7 emergency blood dispatch platform. Find blood banks, check live stock, or register as a donor.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full bg-white text-[#17151a] antialiased selection:bg-[#e8394c]/20 selection:text-[#e8394c]">
        {children}
      </body>
    </html>
  );
}
