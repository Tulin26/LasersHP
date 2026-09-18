"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampoArea, CampoTexto } from "@/components/painel/campos";
import { salvarConfiguracoes } from "@/lib/acoes/configuracoes";
import { ESTADO_INICIAL } from "@/lib/acoes/tipos";
import { formatarTelefone } from "@/lib/formatar";
import type { Configuracoes } from "@/lib/tipos/database.types";

export function FormularioConfiguracoes({ config }: { config: Configuracoes }) {
  const [estado, acao, enviando] = useActionState(
    salvarConfiguracoes,
    ESTADO_INICIAL,
  );
  const router = useRouter();

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.mensagem ?? "Salvo.");
      router.refresh();
    } else if (estado.mensagem) {
      toast.error(estado.mensagem);
    }
  }, [estado, router]);

  return (
    <form action={acao} className="space-y-6">
      <section className="bg-card space-y-4 rounded-xl border p-4">
        <div>
          <h2 className="font-semibold">Contato</h2>
          <p className="text-muted-foreground text-sm">
            O WhatsApp e o mais importante: e para ele que todo pedido do site e
            encaminhado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            nome="nome_negocio"
            rotulo="Nome do negocio"
            valor={config.nome_negocio}
            obrigatorio
            erro={estado.erros?.nome_negocio?.[0]}
          />
          <CampoTexto
            nome="whatsapp"
            rotulo="WhatsApp"
            tipo="tel"
            valor={config.whatsapp ? formatarTelefone(config.whatsapp) : ""}
            placeholder="(44) 99999-8888"
            ajuda="Com DDD. O DDI 55 e adicionado sozinho."
            obrigatorio
            erro={estado.erros?.whatsapp?.[0]}
          />
          <CampoTexto
            nome="email_contato"
            rotulo="E-mail de contato"
            tipo="email"
            valor={config.email_contato}
            erro={estado.erros?.email_contato?.[0]}
          />
          <CampoTexto
            nome="cidade"
            rotulo="Cidade"
            valor={config.cidade}
            erro={estado.erros?.cidade?.[0]}
          />
          <CampoTexto
            nome="instagram"
            rotulo="Instagram"
            valor={config.instagram}
            placeholder="@seuperfil"
            ajuda="So o usuario; o link e montado sozinho."
            erro={estado.erros?.instagram?.[0]}
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <div>
          <h2 className="font-semibold">Textos da pagina inicial</h2>
          <p className="text-muted-foreground text-sm">
            Aparecem no topo do site, antes dos equipamentos.
          </p>
        </div>

        <CampoTexto
          nome="titulo_home"
          rotulo="Titulo principal"
          valor={config.titulo_home}
          placeholder="Equipamentos de laser para estetica"
          erro={estado.erros?.titulo_home?.[0]}
        />

        <CampoArea
          nome="subtitulo_home"
          rotulo="Subtitulo"
          valor={config.subtitulo_home}
          linhas={2}
          placeholder="Tecnologia profissional para clinicas e esteticistas."
          erro={estado.erros?.subtitulo_home?.[0]}
        />

        <CampoArea
          nome="texto_sobre"
          rotulo="Texto da secao Sobre"
          valor={config.texto_sobre}
          linhas={5}
          erro={estado.erros?.texto_sobre?.[0]}
        />
      </section>

      <section className="bg-card space-y-4 rounded-xl border p-4">
        <div>
          <h2 className="font-semibold">SEO e compartilhamento</h2>
          <p className="text-muted-foreground text-sm">
            Como o site aparece no Google e na previa do link no WhatsApp e no
            Instagram. Se deixar em branco, usamos os textos da home.
          </p>
        </div>

        <CampoTexto
          nome="seo_titulo"
          rotulo="Titulo para o Google"
          valor={config.seo_titulo}
          ajuda="Ate 60 caracteres funciona melhor."
          erro={estado.erros?.seo_titulo?.[0]}
        />

        <CampoArea
          nome="seo_descricao"
          rotulo="Descricao para o Google"
          valor={config.seo_descricao}
          linhas={2}
          ajuda="Entre 120 e 160 caracteres e o ideal."
          erro={estado.erros?.seo_descricao?.[0]}
        />

        <CampoTexto
          nome="og_imagem_url"
          rotulo="Imagem de compartilhamento (URL)"
          tipo="url"
          valor={config.og_imagem_url}
          ajuda="Imagem que aparece ao colar o link do site no WhatsApp. Ideal 1200x630."
          erro={estado.erros?.og_imagem_url?.[0]}
        />
      </section>

      <Button type="submit" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Salvando...
          </>
        ) : (
          "Salvar configuracoes"
        )}
      </Button>
    </form>
  );
}
