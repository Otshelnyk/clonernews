const API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

export async function fetchPostIds(type) {
    // Поддержка различных типов постов
    const typeMap = {
        'newstories': 'newstories',
        'topstories': 'topstories',
        'beststories': 'beststories',
        'askstories': 'askstories',
        'showstories': 'showstories',
        'jobstories': 'jobstories'
    };
    
    const apiType = typeMap[type] || type;
    const url = `${API_BASE_URL}/${apiType}.json`;
    console.log(`API: Запрос списка ID (${type}): ${url}`);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const ids = await response.json();
        console.log(`API: Получено ${ids.length} ID для ${type}`);
        return ids;
    } catch (error) {
        console.error(`API Error: Failed to fetch post IDs for ${type}:`, error);
        return [];
    }
} 

// Создаем Map для отслеживания активных запросов
const activeRequests = new Map();

export async function fetchItem(id) {
    // Если запрос уже выполняется, возвращаем существующий Promise
    if (activeRequests.has(id)) {
        return activeRequests.get(id);
    }
    
    const url = `${API_BASE_URL}/item/${id}.json`;
    
    const requestPromise = (async () => {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const item = await response.json();
            return item;
        } catch (error) {
            console.error(`API Error: Failed to fetch item ${id}:`, error);
            return null;
        } finally {
            // Убираем запрос из активных после завершения
            activeRequests.delete(id);
        }
    })();
    
    // Сохраняем Promise в Map
    activeRequests.set(id, requestPromise);
    
    return requestPromise;
}