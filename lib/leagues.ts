// Official F1 games our community plays in, with the private-league codes members have to join.
export const F1_LEAGUES = {
  fantasy: {
    name: 'F1 Fantasy',
    site: 'https://fantasy.formula1.com',
    siteLabel: 'fantasy.formula1.com',
    join: 'https://fantasy.formula1.com/en/leagues/join/C57XPPKP703',
    code: 'C57XPPKP703',
  },
  predict: {
    name: 'F1 Predict',
    site: 'https://f1predict.formula1.com',
    siteLabel: 'f1predict.formula1.com',
    join: 'https://f1predict.formula1.com/en/leagues/join/C4MIFTXAH05',
    code: 'C4MIFTXAH05',
  },
} as const
export type LeagueKey = keyof typeof F1_LEAGUES
