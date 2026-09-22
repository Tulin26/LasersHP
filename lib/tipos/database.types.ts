/**
 * Tipos do banco.
 *
 * Normalmente este arquivo e gerado pela CLI do Supabase
 * (`supabase gen types typescript`), mas ele e so um espelho do SQL em
 * `supabase/migrations/0001_schema_inicial.sql` — por isso esta escrito a mao
 * aqui, com comentarios. Se voce mexer no SQL, mexa aqui tambem.
 *
 * Para quem vem do Java: pense nisto como as entidades/DTOs. A diferenca e
 * que em TypeScript eles so existem em tempo de compilacao — no JavaScript
 * final nada disso sobra. Quem realmente protege os dados e o RLS do Postgres.
 *
 * Row    = o que vem do banco ao ler
 * Insert = o que voce precisa mandar para criar (campos com default sao opcionais)
 * Update = tudo opcional, para alteracoes parciais
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [chave: string]: Json | undefined }
  | Json[];

export type AreaAtuacao = "estetica" | "saude" | "ambas";

export type StatusPedido = "novo" | "em_contato" | "fechado" | "cancelado";
export type StatusVenda = "pago" | "pendente" | "cancelado";
export type FormaPagamento =
  | "pix"
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "boleto"
  | "transferencia"
  | "financiamento"
  | "outro";
export type PapelUsuario = "admin" | "vendedor";

export type Database = {
  public: {
    Tables: {
      perfis: {
        Row: {
          id: string;
          nome: string;
          papel: PapelUsuario;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id: string;
          nome?: string;
          papel?: PapelUsuario;
        };
        Update: {
          nome?: string;
          papel?: PapelUsuario;
        };
        Relationships: [];
      };
      vendedores: {
        Row: {
          id: string;
          usuario_id: string | null;
          nome: string;
          telefone: string | null;
          email: string | null;
          ativo: boolean;
          observacoes: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          usuario_id?: string | null;
          nome: string;
          telefone?: string | null;
          email?: string | null;
          ativo?: boolean;
          observacoes?: string | null;
        };
        Update: {
          usuario_id?: string | null;
          nome?: string;
          telefone?: string | null;
          email?: string | null;
          ativo?: boolean;
          observacoes?: string | null;
        };
        Relationships: [];
      };
      produtos: {
        Row: {
          id: string;
          slug: string;
          nome: string;
          modelo: string | null;
          descricao: string | null;
          indicacoes: string | null;
          preco: number | null;
          preco_sob_consulta: boolean;
          estoque: number;
          estoque_minimo: number;
          imagens: string[];
          ativo: boolean;
          destaque: boolean;
          criado_em: string;
          atualizado_em: string;
          /** Coluna gerada pelo banco: estoque > 0. A vitrine mostra isto em vez
           *  da quantidade, que e informacao interna do negocio. */
          disponivel: boolean;
          /** Para qual publico o equipamento e vendido. */
          area: AreaAtuacao;
          /** Texto livre: "808", "755 / 808 / 1064", "400-1200". Nulo quando
           *  o equipamento nao e luz (radiofrequencia, criolipolise). */
          comprimento_onda: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          nome: string;
          area?: AreaAtuacao;
          comprimento_onda?: string | null;
          modelo?: string | null;
          descricao?: string | null;
          indicacoes?: string | null;
          preco?: number | null;
          preco_sob_consulta?: boolean;
          estoque?: number;
          estoque_minimo?: number;
          imagens?: string[];
          ativo?: boolean;
          destaque?: boolean;
        };
        Update: {
          slug?: string;
          nome?: string;
          modelo?: string | null;
          descricao?: string | null;
          indicacoes?: string | null;
          preco?: number | null;
          preco_sob_consulta?: boolean;
          estoque?: number;
          estoque_minimo?: number;
          imagens?: string[];
          ativo?: boolean;
          destaque?: boolean;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          telefone: string | null;
          email: string | null;
          documento: string | null;
          cidade: string | null;
          observacoes: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          telefone?: string | null;
          email?: string | null;
          documento?: string | null;
          cidade?: string | null;
          observacoes?: string | null;
        };
        Update: {
          nome?: string;
          telefone?: string | null;
          email?: string | null;
          documento?: string | null;
          cidade?: string | null;
          observacoes?: string | null;
        };
        Relationships: [];
      };
      pedidos: {
        Row: {
          id: string;
          produto_id: string | null;
          nome: string;
          telefone: string;
          email: string | null;
          cidade: string | null;
          mensagem: string | null;
          status: StatusPedido;
          cliente_id: string | null;
          ip_hash: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          produto_id?: string | null;
          nome: string;
          telefone: string;
          email?: string | null;
          cidade?: string | null;
          mensagem?: string | null;
          status?: StatusPedido;
          cliente_id?: string | null;
          ip_hash?: string | null;
        };
        Update: {
          status?: StatusPedido;
          cliente_id?: string | null;
        };
        Relationships: [];
      };
      vendas: {
        Row: {
          id: string;
          data: string;
          cliente_id: string;
          vendedor_id: string;
          pedido_id: string | null;
          subtotal: number;
          desconto: number;
          /** coluna calculada pelo banco: subtotal - desconto */
          total: number;
          forma_pagamento: FormaPagamento;
          status: StatusVenda;
          observacoes: string | null;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          data?: string;
          cliente_id: string;
          vendedor_id: string;
          pedido_id?: string | null;
          desconto?: number;
          forma_pagamento?: FormaPagamento;
          status?: StatusVenda;
          observacoes?: string | null;
          criado_por?: string | null;
        };
        Update: {
          data?: string;
          cliente_id?: string;
          vendedor_id?: string;
          desconto?: number;
          forma_pagamento?: FormaPagamento;
          status?: StatusVenda;
          observacoes?: string | null;
        };
        Relationships: [];
      };
      venda_itens: {
        Row: {
          id: string;
          venda_id: string;
          produto_id: string;
          quantidade: number;
          valor_unitario: number;
          /** coluna calculada pelo banco: quantidade * valor_unitario */
          subtotal: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          venda_id: string;
          produto_id: string;
          quantidade: number;
          valor_unitario: number;
        };
        Update: {
          quantidade?: number;
          valor_unitario?: number;
        };
        Relationships: [];
      };
      configuracoes: {
        Row: {
          id: number;
          nome_negocio: string;
          whatsapp: string;
          email_contato: string | null;
          cidade: string | null;
          instagram: string | null;
          titulo_home: string;
          subtitulo_home: string;
          texto_sobre: string | null;
          seo_titulo: string | null;
          seo_descricao: string | null;
          og_imagem_url: string | null;
          atualizado_em: string;
        };
        Insert: {
          id?: number;
          nome_negocio?: string;
          whatsapp?: string;
          email_contato?: string | null;
          cidade?: string | null;
          instagram?: string | null;
          titulo_home?: string;
          subtitulo_home?: string;
          texto_sobre?: string | null;
          seo_titulo?: string | null;
          seo_descricao?: string | null;
          og_imagem_url?: string | null;
        };
        Update: {
          nome_negocio?: string;
          whatsapp?: string;
          email_contato?: string | null;
          cidade?: string | null;
          instagram?: string | null;
          titulo_home?: string;
          subtitulo_home?: string;
          texto_sobre?: string | null;
          seo_titulo?: string | null;
          seo_descricao?: string | null;
          og_imagem_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      eh_admin: { Args: Record<never, never>; Returns: boolean };
      eh_equipe: { Args: Record<never, never>; Returns: boolean };
      meu_vendedor_id: { Args: Record<never, never>; Returns: string | null };
      pode_enviar_pedido: { Args: { p_ip_hash: string }; Returns: boolean };
      /** Freio de forca bruta no login. So o servidor chama (chave secreta). */
      pode_tentar_login: {
        Args: { p_ip_hash: string; p_email_hash: string };
        Returns: boolean;
      };
      registrar_tentativa_login: {
        Args: { p_ip_hash: string; p_email_hash: string; p_sucesso: boolean };
        Returns: undefined;
      };
      ajustar_estoque: {
        Args: { p_produto_id: string; p_delta: number };
        Returns: undefined;
      };
      cancelar_venda: {
        Args: { p_venda_id: string };
        Returns: Database["public"]["Tables"]["vendas"]["Row"];
      };
      registrar_venda: {
        Args: {
          p_cliente_id: string;
          p_vendedor_id: string;
          p_itens: Json;
          p_desconto?: number;
          p_forma_pagamento?: FormaPagamento;
          p_status?: StatusVenda;
          p_data?: string;
          p_pedido_id?: string | null;
          p_observacoes?: string | null;
          p_baixar_estoque?: boolean;
        };
        Returns: Database["public"]["Tables"]["vendas"]["Row"];
      };
    };
    Enums: {
      area_atuacao: AreaAtuacao;
      status_pedido: StatusPedido;
      status_venda: StatusVenda;
      forma_pagamento: FormaPagamento;
      papel_usuario: PapelUsuario;
    };
    CompositeTypes: Record<never, never>;
  };
};

/** Atalhos usados pelo resto do codigo, para nao repetir o caminho inteiro. */
type Tabelas = Database["public"]["Tables"];

export type Perfil = Tabelas["perfis"]["Row"];
export type Vendedor = Tabelas["vendedores"]["Row"];
export type Produto = Tabelas["produtos"]["Row"];
export type Cliente = Tabelas["clientes"]["Row"];
export type Pedido = Tabelas["pedidos"]["Row"];
export type Venda = Tabelas["vendas"]["Row"];
export type VendaItem = Tabelas["venda_itens"]["Row"];
export type Configuracoes = Tabelas["configuracoes"]["Row"];

/** Venda com os relacionamentos que as telas do painel carregam junto. */
export type VendaCompleta = Venda & {
  clientes: Pick<Cliente, "id" | "nome" | "telefone" | "cidade"> | null;
  vendedores: Pick<Vendedor, "id" | "nome"> | null;
  venda_itens: (VendaItem & {
    produtos: Pick<Produto, "id" | "nome" | "modelo"> | null;
  })[];
};

export type PedidoCompleto = Pedido & {
  produtos: Pick<Produto, "id" | "nome" | "modelo" | "slug"> | null;
};
