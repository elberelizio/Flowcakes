export type LegalDocumentId = 'terms' | 'privacy';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  terms: {
    id: 'terms',
    title: 'Termos de Utilização',
    updatedAt: 'Maio de 2026',
    intro:
      'Ao criar conta no Flow Cakes, o utilizador declara que leu, compreendeu e aceita estes Termos de Utilização. O acesso ao sistema sem aceitação explícita não é permitido.',
    sections: [
      {
        title: '1. Objeto do serviço',
        paragraphs: [
          'O Flow Cakes é uma plataforma de gestão para confeiteiras e negócios de confeitaria, incluindo encomendas, clientes, dívidas, relatórios financeiros e lembretes.',
          'A conta é pessoal e intransmissível. É proibido partilhar credenciais ou permitir acesso não autorizado a terceiros.',
        ],
      },
      {
        title: '2. Registo e veracidade dos dados',
        paragraphs: [
          'O utilizador compromete-se a fornecer dados verdadeiros, completos e actualizados no momento do registo.',
          'Informações falsas ou uso indevido da plataforma podem resultar em suspensão ou encerramento da conta.',
        ],
      },
      {
        title: '3. Licença e pagamentos',
        paragraphs: [
          'O acesso pleno ao sistema depende de licença activa (período de teste ou plano pago, conforme disponibilizado).',
          'Valores, prazos e meios de pagamento são apresentados no site antes da subscrição.',
        ],
      },
      {
        title: '4. Uso aceitável',
        paragraphs: [
          'É proibido tentar contornar controlos de segurança, aceder a áreas restritas sem autorização, automatizar ataques ou extrair dados de outros utilizadores.',
          'Qualquer tentativa de «invadir» ou comprometer o sistema será bloqueada e poderá ser reportada às autoridades competentes.',
        ],
      },
      {
        title: '5. Responsabilidade',
        paragraphs: [
          'O Flow Cakes esforça-se por manter o serviço disponível, mas não garante funcionamento ininterrupto em caso de falhas de rede, terceiros ou força maior.',
          'Decisões de negócio (preços, prazos, ingredientes) são da exclusiva responsabilidade do utilizador.',
        ],
      },
      {
        title: '6. Alterações',
        paragraphs: [
          'Estes termos podem ser actualizados. A data da última versão será indicada no documento.',
          'O uso continuado do serviço após alterações constitui aceitação da nova versão, quando aplicável.',
        ],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    title: 'Política de Privacidade',
    updatedAt: 'Maio de 2026',
    intro:
      'Esta política explica como o Flow Cakes trata os dados pessoais recolhidos no registo e durante a utilização do sistema, em conformidade com boas práticas de protecção de dados.',
    sections: [
      {
        title: '1. Dados que recolhemos',
        paragraphs: [
          'No registo: nome, província, contacto telefónico, e-mail (opcional) e credenciais de acesso (senha armazenada de forma segura no servidor).',
          'Durante o uso: dados de encomendas, clientes, pagamentos e actividade necessários ao funcionamento da aplicação.',
        ],
      },
      {
        title: '2. Finalidade do tratamento',
        paragraphs: [
          'Prestar o serviço de gestão contratado, autenticar o utilizador, processar pagamentos de licença e prestar suporte.',
          'Melhorar a segurança, prevenir fraude e cumprir obrigações legais quando exigido.',
        ],
      },
      {
        title: '3. Base legal e conservação',
        paragraphs: [
          'O tratamento baseia-se na execução do contrato (utilização do sistema) e no consentimento, quando aplicável (ex.: comunicações opcionais).',
          'Os dados são conservados enquanto a conta estiver activa e pelo período necessário após encerramento, para efeitos legais ou de resolução de litígios.',
        ],
      },
      {
        title: '4. Partilha com terceiros',
        paragraphs: [
          'Não vendemos dados pessoais. Podemos partilhar informação mínima com prestadores técnicos (alojamento, pagamentos M-Pesa/e-Mola) apenas para operar o serviço.',
          'Qualquer transferência é limitada ao estritamente necessário e sujeita a medidas de segurança.',
        ],
      },
      {
        title: '5. Direitos do titular',
        paragraphs: [
          'O utilizador pode solicitar acesso, correcção ou eliminação dos seus dados, bem como opor-se a tratamentos não essenciais, através dos canais de contacto da empresa.',
          'Para exercer estes direitos, utilize a página de contacto ou o e-mail indicado no site.',
        ],
      },
      {
        title: '6. Segurança',
        paragraphs: [
          'Aplicamos medidas técnicas e organizativas para proteger os dados contra acesso não autorizado, perda ou alteração indevida.',
          'O utilizador deve manter a senha confidencial e reportar suspeitas de uso indevido da conta.',
        ],
      },
    ],
  },
};
