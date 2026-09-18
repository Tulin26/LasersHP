import type { NextConfig } from "next";

/**
 * O next/image so aceita carregar imagens de dominios declarados aqui.
 * E uma protecao: sem isso qualquer um poderia usar o seu servidor da Vercel
 * para redimensionar as imagens do site dele, gastando a sua cota.
 *
 * O host sai da propria variavel de ambiente para nao ficar um endereco
 * chumbado no codigo — se voce trocar de projeto Supabase, nada aqui muda.
 */
const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hostSupabase = urlSupabase ? new URL(urlSupabase).hostname : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: hostSupabase
      ? [
          {
            protocol: "https",
            hostname: hostSupabase,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
