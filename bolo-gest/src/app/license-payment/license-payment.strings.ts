/** Textos da UI em português (página de pagamento da licença). */
export const LicensePaymentStrings = {
  documentTitle: 'Pagamento da licença · Flow Cakes',
  backToHome: '← Página inicial',
  backToPanel: '← Voltar ao painel',
  backToChoosePlan: '← Voltar a escolher plano',
  heading: 'Pagamento da licença',
  leadLoggedShort: 'Escolha a operadora, transfira o valor e confirme. Validação manual pelo administrador.',
  restrictedLockNote: 'O resto do sistema fica bloqueado até o administrador confirmar o pagamento.',
  stepNavChoose: 'Operadora',
  stepNavTransfer: 'Transferir',
  stepNavConfirm: 'Confirmar',
  sectionOperator: 'Passo 1 · Operadora',
  sectionTransfer: 'Passo 2 · Transferência',
  sectionConfirm: 'Passo 3 · Confirmação',

  summaryTitle: 'Resumo',
  lineItemName: 'Licença Flow Cakes',
  lineItemMetaPerMonth: 'MZN / 30 dias',
  durationLabel: 'Validade',
  totalDue: 'Total a transferir',

  methodsTitle: 'Como pagar',
  tablistAria: 'Escolher M-Pesa ou e-Mola',

  stepTransfer: '1. Faça a transferência',
  stepTransferHint: (channel: string, amount: number, phone: string) =>
    `Envie exactamente ${amount} MZN para o número ${channel} abaixo.`,
  destinationLabel: (channel: string) => `Número ${channel} (Flow Cakes)`,
  copyNumber: 'Copiar número',

  stepConfirm: '2. Confirme o pedido',
  walletNumberLabel: (channel: string) => `Número de onde enviou (${channel})`,
  transferRefLabel: 'Referência da transferência (opcional)',
  transferRefPlaceholder: 'Ex.: últimos dígitos do SMS M-Pesa / e-Mola',
  transferRefHint: 'Opcional. Se o SMS tiver um número de transação, indique-o para ajudar a validação.',
  placeholderMpesa: '841234567 ou 851234567',
  placeholderEmola: '861234567 ou 871234567',
  hintMpesa: 'O número que usou na carteira M-Pesa (84 ou 85).',
  hintEmola: 'O número que usou na carteira e-Mola (86 ou 87).',
  processing: 'A registar…',
  submitManual: (total: number) => `Confirmar transferência (${total} MZN)`,
  submitPay: (total: number) => `Pagar ${total} MZN`,

  footManualLogged:
    'O pedido fica com estado pendente. O administrador confirma quando o valor chegar à conta Flow Cakes.',
  footLiveLogged: 'Confirme no telemóvel, se aplicável, e volte ao painel para continuar.',

  pendingPopupTitle: 'Pagamento pendente de validação',
  pendingPopupText:
    'Já registámos o seu pedido. Aguarde a confirmação do administrador ou contacte o suporte se demorar.',
  pendingPopupBtn: 'Entendi',
  pendingPanelNote: 'Pedido pendente — aguarda validação do administrador.',
  rejectedBannerTitle: 'Pagamento não confirmado',
  rejectedBannerHint: 'Pode efectuar uma nova transferência com os dados correctos.',
  rejectedPopupTitle: 'Pagamento não confirmado',
  rejectedPopupLead: 'O administrador não validou a sua última transferência:',
  rejectedPopupBtn: 'Tentar novo pagamento',

  supportTitle: 'Precisa de ajuda?',
  supportText: 'WhatsApp ou chamada — indique o seu nome e o valor transferido.',
  supportWhatsapp: 'WhatsApp suporte',
  supportCall: 'Ligar',

  secureNote: 'Pedido registado de forma segura no Flow Cakes.',

  errWalletRequired: (channel: string) => `Indique o número ${channel} de onde enviou.`,
  errMpesaFormat: 'M-Pesa: use 9 dígitos começando por 84 ou 85 (ex.: 841234567).',
  errEmolaFormat: 'e-Mola: use 9 dígitos começando por 86 ou 87 (ex.: 861234567).',

  toastCopyNumber: 'Número copiado.',
  toastPendingRegistered: 'Pedido registado. Aguarde a confirmação do administrador.',
  toastConfirmOnPhone: 'Pedido enviado. Confirme o pagamento com o PIN no seu telemóvel.',
  toastRenewalSuccess: 'Pagamento confirmado. A sua licença foi renovada.',
  toastPaymentApproved:
    'Pagamento aprovado. Obrigado! Já pode usar todos os serviços do Flow Cakes.',
  toastPaymentRejected: 'Pagamento não confirmado. Pode enviar uma nova transferência.',
  toastSubmitError: 'Não foi possível registar o pedido. Tente novamente.',
  toastLoadError: 'Não foi possível carregar os dados de pagamento.',
} as const;
