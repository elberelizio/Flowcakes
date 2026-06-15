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
    updatedAt: 'Junho de 2026',
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
          'O contacto telefónico indicado no registo deve ser o número pessoal e actual do utilizador. Não deve usar números fictícios, temporários ou de terceiros sem autorização.',
          'Informações falsas ou uso indevido da plataforma podem resultar em suspensão ou encerramento da conta.',
        ],
      },
      {
        title: '3. Conta e contacto de acesso',
        paragraphs: [
          'O número de telemóvel registado é o identificador principal de login da conta e serve também para recuperação de senha e comunicações relacionadas com a licença.',
          'Os dados inseridos no sistema (encomendas, clientes, configurações, histórico de licença e pagamentos) estão associados à conta criada no registo e não se transferem automaticamente para outra conta.',
          'O utilizador pode alterar o contacto de login em «Meu perfil», desde que o novo número não esteja registado noutra conta. Após a alteração, mantém-se a mesma conta, com os mesmos dados e o mesmo estado de licença; apenas muda o número usado para entrar.',
          'O contacto anterior deixa de estar associado à conta e pode voltar a ficar disponível para um novo registo. Um novo registo com esse número cria uma conta distinta, sem acesso aos dados da conta original, sujeita às regras de licença então em vigor (incluindo período de teste gratuito, se aplicável).',
          'O Flow Cakes pode utilizar estas regras, os registos de actividade da conta e as alterações de contacto para esclarecer disputas sobre acesso, propriedade dos dados ou uso indevido do serviço.',
        ],
      },
      {
        title: '4. Licença e pagamentos',
        paragraphs: [
          'O acesso pleno ao sistema depende de licença activa (período de teste ou plano pago, conforme disponibilizado).',
          'Valores, prazos e meios de pagamento são apresentados no site antes da subscrição.',
        ],
      },
      {
        title: '5. Uso aceitável',
        paragraphs: [
          'É proibido tentar contornar controlos de segurança, aceder a áreas restritas sem autorização, automatizar ataques ou extrair dados de outros utilizadores.',
          'Qualquer tentativa de «invadir» ou comprometer o sistema será bloqueada e poderá ser reportada às autoridades competentes.',
        ],
      },
      {
        title: '6. Responsabilidade',
        paragraphs: [
          'O Flow Cakes esforça-se por manter o serviço disponível, mas não garante funcionamento ininterrupto em caso de falhas de rede, terceiros ou força maior.',
          'Decisões de negócio (preços, prazos, ingredientes) são da exclusiva responsabilidade do utilizador.',
        ],
      },
      {
        title: '7. Alterações',
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
    updatedAt: 'Junho de 2026',
    intro:
      'Esta política explica como o Flow Cakes trata os dados pessoais recolhidos no registo e durante a utilização do sistema, em conformidade com boas práticas de protecção de dados.',
    sections: [
      {
        title: '1. Dados que recolhemos',
        paragraphs: [
          'No registo: nome, província, contacto telefónico, e-mail (opcional) e credenciais de acesso (senha armazenada de forma segura no servidor).',
          'O contacto telefónico é tratado como identificador principal da conta para autenticação, recuperação de senha e comunicações sobre a licença.',
          'Durante o uso: dados de encomendas, clientes, pagamentos e actividade necessários ao funcionamento da aplicação.',
        ],
      },
      {
        title: '2. Conta, contacto e alteração de número',
        paragraphs: [
          'A conta é identificada internamente pelo sistema e associada ao contacto de login activo. Os dados de negócio (encomendas, clientes, etc.) permanecem ligados a essa conta, e não ao número de telefone em si.',
          'Quando o utilizador altera o contacto em «Meu perfil», o novo número passa a ser o identificador de login; o número anterior deixa de autenticar essa conta.',
          'O contacto anterior pode voltar a ficar disponível para um novo registo por outra pessoa ou pelo mesmo utilizador, originando uma conta distinta. Os dados da conta original não são copiados automaticamente para a nova conta.',
          'Registamos alterações de contacto e actividade relacionada com a conta por motivos de segurança, prevenção de fraude e resolução de litígios sobre acesso ou propriedade dos dados.',
        ],
      },
      {
        title: '3. Finalidade do tratamento',
        paragraphs: [
          'Prestar o serviço de gestão contratado, autenticar o utilizador, processar pagamentos de licença e prestar suporte.',
          'Melhorar a segurança, prevenir fraude e cumprir obrigações legais quando exigido.',
        ],
      },
      {
        title: '4. Base legal e conservação',
        paragraphs: [
          'O tratamento baseia-se na execução do contrato (utilização do sistema) e no consentimento, quando aplicável (ex.: comunicações opcionais).',
          'Os dados são conservados enquanto a conta estiver activa e pelo período necessário após encerramento, para efeitos legais ou de resolução de litígios.',
        ],
      },
      {
        title: '5. Partilha com terceiros',
        paragraphs: [
          'Não vendemos dados pessoais. Podemos partilhar informação mínima com prestadores técnicos (alojamento, pagamentos M-Pesa/e-Mola) apenas para operar o serviço.',
          'Qualquer transferência é limitada ao estritamente necessário e sujeita a medidas de segurança.',
        ],
      },
      {
        title: '6. Direitos do titular',
        paragraphs: [
          'O utilizador pode solicitar acesso, correcção ou eliminação dos seus dados, bem como opor-se a tratamentos não essenciais, através dos canais de contacto da empresa.',
          'Para exercer estes direitos, utilize a página de contacto ou o e-mail indicado no site.',
        ],
      },
      {
        title: '7. Segurança',
        paragraphs: [
          'Aplicamos medidas técnicas e organizativas para proteger os dados contra acesso não autorizado, perda ou alteração indevida.',
          'O utilizador deve manter a senha confidencial e reportar suspeitas de uso indevido da conta.',
        ],
      },
    ],
  },
};
