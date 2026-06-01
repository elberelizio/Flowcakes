/** Textos da UI em português (página de pagamento da licença). */
export const LicensePaymentStrings = {
  documentTitle: 'Pagamento da licença · Chef Control',
  backToHome: '← Página inicial',
  backToPanel: '← Voltar ao painel',
  backToChoosePlan: '← Voltar a escolher plano',
  heading: 'Pagamento da licença',
  lead: 'Para pagar, crie conta primeiro e depois inicie sessão.',
  leadLogged: 'Escolha M-Pesa ou e-Mola e confirme o número da carteira (84/85 ou 86/87).',

  sessionHintPrefix: 'Sessão:',
  sessionHintRest: 'confirme o número e a duração.',

  guestCardTitle: 'Antes de pagar',
  guestCardText: 'Ainda não tem conta? Crie a conta e depois entre para concluir o pagamento da licença.',
  guestCreateAccount: 'Criar conta',
  guestSignIn: 'Já tenho conta · Entrar',

  summaryTitle: 'Resumo',
  lineItemName: 'Licença Chef Control',
  lineItemMetaPerMonth: 'MZN / mês',
  durationLabel: 'Duração',
  totalDue: 'Total a pagar',

  methodsTitle: 'Meio de pagamento',
  tablistAria: 'Escolher M-Pesa ou e-Mola',

  walletNumberLabel: (channel: string) => `Número ${channel}`,
  placeholderMpesa: '841234567 ou 851234567',
  placeholderEmola: '861234567 ou 871234567',
  hintMpesa: 'M-Pesa em Moçambique: 9 dígitos começando por 84 ou 85.',
  hintEmola: 'e-Mola: 9 dígitos começando por 86 ou 87.',
  hintSimulated: 'Simulação: sem cobrança real. O administrador pode aprovar a licença manualmente.',

  processing: 'A processar…',
  submitSimulated: (total: number) => `Enviar pedido (${total} MZN)`,
  submitPay: (total: number) => `Pagar ${total} MZN`,

  footSimulatedLogged: 'Depois do envio, aguarde a aprovação do administrador e volte ao painel.',
  footLiveLogged: 'Confirme no telemóvel, se aplicável, e volte ao painel para continuar.',

  secureNote: 'Ligação segura ao servidor Chef Control.',

  errWalletRequired: (channel: string) => `Introduza o número ${channel}.`,
  errMpesaFormat: 'M-Pesa: use 9 dígitos começando por 84 ou 85 (ex.: 841234567).',
  errEmolaFormat: 'e-Mola: use 9 dígitos começando por 86 ou 87 (ex.: 861234567).',
  errNeedAccount: 'Crie conta e inicie sessão para efectuar o pagamento.',
} as const;
