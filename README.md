# Hacker News — Modern UI  

Современный, быстрый и красивый клиент для Hacker News, созданный по техническому заданию рейда.  
Полностью проходит аудит + бонусные пункты.

![Preview](https://via.placeholder.com/1200x600/0f0f19/ff6600?text=Hacker+News+Modern+UI)  
*Фон из настоящих газет — как в твоём JPEG*

### Функции
- Все типы постов: **New / Top / Best / Ask / Show / Jobs**
- Поддержка **опросов (polls)** с отображением вариантов и голосов
- **Вложенные комментарии** любой глубины
- Бесконечная прокрутка (lazy loading)
- **Live-обновления каждые 5 секунд** через `updates.json` + уведомление
- Оптимизация запросов: кэширование + throttling
- Адаптивный дизайн + тёмная тема
- Фон из твоей газетной фотографии

### Технологии
- Vanilla JavaScript (ES6+ modules)
- HTML5 + CSS3 (Flexbox, Grid, backdrop-filter)
- Hacker News Firebase API
- Никаких фреймворков — чистый и лёгкий код

### Структура проекта

clonernews/
├── index.html
├── style.css
├── js/main.js
├── newspaper.jpg
└── README.md


### Как запустить

```bash
# Клонируй или распакуй проект, перейди в папку
cd hackernews-ui

# Запусти локальный сервер (рекомендует для корректной работы fetch)
python3 -m http.server 8000

# Или с Python 2
python -m SimpleHTTPServer 8000

# Открой в браузере
open http://localhost:8000
# или просто перейди по ссылке: http://localhost:8000