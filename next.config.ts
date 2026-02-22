import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Pacotes que devem rodar no servidor (não bundled pelo Turbopack/webpack)
  serverExternalPackages: ["@prisma/client", "prisma", "@react-pdf/renderer", "pg"],
  // Necessário para conviver com o webpack config injetado pelo next-pwa
  turbopack: {},
};

export default withPWA(nextConfig);
