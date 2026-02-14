// CryptoDash — DOM Cache

export const el: Record<string, HTMLElement | null> = {};

export function cacheDOM(): void {
  const ids = [
    'loadingOverlay', 'toastContainer', 'errorBanner', 'dismissError',
    'priceCards', 'fgValue', 'fgSentiment', 'fgFill',
    'chartSubtitle', 'selectedCoin', 'priceChart', 'chartLoader',
    'btcDominance', 'btcDominanceBar', 'totalMarketCap', 'totalVolume', 'activeCryptos',
    'topGainers', 'topLosers',
    'marketTableBody', 'marketSearch', 'marketLoadMore', 'marketLoader', 'marketRefreshButton',
    'converterFrom', 'converterTo', 'converterAmount', 'converterResult', 'converterRate', 'converterSwap', 'quickConvertGrid',
    'walletForm', 'walletCoin', 'walletCoinSearch', 'walletCoinDropdown', 'walletCoinList',
    'walletAmount', 'walletBuyPrice', 'walletFormPreview', 'walletPreviewText',
    'walletList', 'walletTotal', 'walletChart', 'walletChartLegend',
    'walletTotalBig', 'walletInvested', 'walletCount', 'walletPnl',
    'walletSort', 'walletPortfolioPanel',
    'walletModal', 'walletModalCoin', 'walletModalClose', 'walletEditForm',
    'walletEditAmount', 'walletEditBuyPrice', 'walletEditDelete',
    'alertForm', 'alertCoin', 'alertCondition', 'alertTarget', 'alertList', 'clearTriggeredAlerts', 'alertBadge',
    'enableNotifications',
    'newsGrid', 'newsRefreshButton',
    'accentPicker', 'resetButton', 'reducedMotionToggle', 'discreetToggle',
    'autoRefreshToggle', 'refreshInterval', 'refreshIntervalRow', 'autoRefreshBadge', 'autoRefreshCountdown',
    'exportDataButton', 'importDataInput', 'currencyToggle', 'themeToggle', 'languageSelector',
    'statusDot', 'statusLabel', 'mockIndicator', 'lastUpdate', 'refreshButton',
    'coinDetailBack', 'coinDetailIcon', 'coinDetailName', 'coinDetailSymbol', 'coinDetailStats',
    'coinDetailFav', 'coinDetailChart', 'coinDetailChartLoader', 'coinDetailChartSubtitle',
    'coinDetailTimeframe', 'coinDetailInfo',
  ];

  ids.forEach(id => {
    el[id] = document.getElementById(id);
  });
}
