// Слушаем событие клика по иконке расширения
chrome.action.onClicked.addListener((tab) => {
  // Создаем новую вкладку с URL нашего файла game.html
  chrome.tabs.create({
    url: chrome.runtime.getURL('game.html')
  });
});