import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { formatarTelefone } from "@/lib/formatar";
import { montarLinkWhatsApp } from "@/lib/whatsapp";
import type { Configuracoes } from "@/lib/tipos/database.types";

/**
 * A partir da versao 1 o lucide-react tirou os icones de marca (Instagram,
 * Facebook...) do pacote, por questao de licenca. Como e um so, fica aqui
 * como SVG inline em vez de instalar outra biblioteca inteira por causa dele.
 */
function IconeInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Rodape({ config }: { config: Configuracoes }) {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="font-semibold">{config.nome_negocio}</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Equipamentos de laser para estetica, com atendimento direto e
            suporte de quem conhece o setor.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium">Contato</h3>
          <ul className="text-muted-foreground mt-2 space-y-2 text-sm">
            {config.whatsapp && (
              <li>
                <a
                  href={montarLinkWhatsApp(config.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-2 transition"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {formatarTelefone(config.whatsapp)}
                </a>
              </li>
            )}
            {config.email_contato && (
              <li>
                <a
                  href={`mailto:${config.email_contato}`}
                  className="hover:text-foreground inline-flex items-center gap-2 transition"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {config.email_contato}
                </a>
              </li>
            )}
            {config.cidade && (
              <li className="inline-flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {config.cidade}
              </li>
            )}
            {config.instagram && (
              <li>
                <a
                  href={`https://instagram.com/${config.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex items-center gap-2 transition"
                >
                  <IconeInstagram className="size-4" />
                  {config.instagram}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium">Navegacao</h3>
          <ul className="text-muted-foreground mt-2 space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-foreground transition">
                Inicio
              </Link>
            </li>
            <li>
              <Link
                href="/equipamentos"
                className="hover:text-foreground transition"
              >
                Equipamentos
              </Link>
            </li>
            <li>
              {/* Entrada discreta do painel: quem trabalha sabe onde fica. */}
              <Link href="/login" className="hover:text-foreground transition">
                Area restrita
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-muted-foreground border-t py-4 text-center text-xs">
        &copy; {ano} {config.nome_negocio}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
