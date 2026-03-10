# Painel de administração (admin-dashboard)

Estrutura da página para facilitar trabalho em equipa: cada secção tem os seus ficheiros e responsabilidades claras.

## Estrutura de pastas

```
admin-dashboard/
├── README.md                    # Este ficheiro
├── admin-dashboard.component.*  # Shell: layout, loading, carrega dados e delega nas secções
├── admin-dashboard.service.ts    # Chamadas à API (stats, revenue-by-month)
├── constants/
│   └── quick-actions.ts         # Lista de links "Acesso rápido" (um sítio para editar)
├── models/
│   └── index.ts                 # Interfaces partilhadas (AdminStats, KpiTile, QuickAction, etc.)
└── components/
    ├── admin-kpi-section/       # KPIs (utilizadores, activos, receita) + Acessos ao sistema
    ├── admin-charts-section/    # 3 gráficos: Receita por mês, Licenças, Actividade hoje
    └── admin-quick-actions-section/  # Grid de links (Gestão licenças, Logs, Encomendas, etc.)
```

## Quem pode trabalhar em quê

| Área | Ficheiros | Responsabilidade |
|------|-----------|------------------|
| **Dados / API** | `admin-dashboard.service.ts`, `models/index.ts` | Novos endpoints, tipos |
| **KPIs** | `components/admin-kpi-section/*` | Tiles de números, secção "Acessos ao sistema" |
| **Gráficos** | `components/admin-charts-section/*` | Chart.js, novos gráficos |
| **Ações rápidas** | `constants/quick-actions.ts`, `components/admin-quick-actions-section/*` | Links e layout do grid |
| **Página (shell)** | `admin-dashboard.component.*` | Ordem das secções, loading, cabeçalho |

## Regras

- Tipos partilhados ficam em `models/index.ts`.
- Novas rotas de "Acesso rápido" editam-se em `constants/quick-actions.ts`.
- Cada componente de secção tem o seu HTML, TS e SCSS; evita-se alterar o shell para mudar uma secção.
