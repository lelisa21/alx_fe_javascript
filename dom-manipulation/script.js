let quotes = [
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The only way to do great work is to love what you do.", category: "Work" },
  { text: "What we think, we become.", category: "Mindfulness" }
];

const MOCK_API_URL = "https://jsonplaceholder.typicode.com/posts"; 
const SYNC_INTERVAL = 30000; 


function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function loadQuotes() {
  const storedQuotes = localStorage.getItem('quotes');
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}

function saveLastFilter() {
  const filter = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastFilter', filter);
}

function loadLastFilter() {
  const lastFilter = localStorage.getItem('lastFilter');
  if (lastFilter) {
    const filterSelect = document.getElementById('categoryFilter');
    filterSelect.value = lastFilter;
  }
}


function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    formContainer.className = 'controls';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Add a New Quote';
    
    const quoteInput = document.createElement('input');
    quoteInput.type = 'text';
    quoteInput.placeholder = 'Enter a new quote';
    quoteInput.id = 'newQuoteText';
    
    const categoryInput = document.createElement('input');
    categoryInput.type = 'text';
    categoryInput.placeholder = 'Enter quote category';
    categoryInput.id = 'newQuoteCategory';
    
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Quote';
    addButton.onclick = addQuote;
    

    formContainer.appendChild(heading);
    formContainer.appendChild(quoteInput);
    formContainer.appendChild(categoryInput);
    formContainer.appendChild(addButton);

    const quoteContainer = document.querySelector('.quote-container');
    quoteContainer.parentNode.insertBefore(formContainer, quoteContainer.nextSibling);
}

function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText').value;
  const newQuoteCategory = document.getElementById('newQuoteCategory').value;

  if (newQuoteText && newQuoteCategory) {
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote);
    saveQuotes();

    syncQuotes(newQuote);

    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    populateCategories();
    showRandomQuote();
    
    alert('Quote added successfully!');
  } else {
    alert('Please enter both a quote and a category.');
  }
}

function showRandomQuote() {
  const filterSelect = document.getElementById('categoryFilter');
  const selectedCategory = filterSelect.value;
  
  let filteredQuotes = quotes;
  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(quote => quote.category === selectedCategory);
  }

  if (filteredQuotes.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    const quote = filteredQuotes[randomIndex];
    document.getElementById('quoteDisplay').innerHTML = `<p>"${quote.text}"</p><p><em>- ${quote.category}</em></p>`;

    sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
  } else {
    document.getElementById('quoteDisplay').innerHTML = '<p>No quotes available for this category.</p>';
  }
}

function populateCategories() {
  const filterSelect = document.getElementById('categoryFilter');
  const uniqueCategories = new Set(quotes.map(quote => quote.category));
  
  filterSelect.innerHTML = '<option value="all">All Categories</option>';
  
  uniqueCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    filterSelect.appendChild(option);
  });
  
  loadLastFilter();
}

function filterQuotes() {
  saveLastFilter();
  showRandomQuote();
}

// JSON Import/Export
function exportQuotes() {
  const jsonQuotes = JSON.stringify(quotes, null, 2);
  const blob = new Blob([jsonQuotes], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      showRandomQuote();

      importedQuotes.forEach(quote => syncQuotes(quote));
      
      alert('Quotes imported successfully!');
    } catch (error) {
      alert('Error parsing JSON file. Please ensure the format is correct.');
    }
  };
  fileReader.readAsText(file);
}


async function syncQuotes(quote) {
  try {
    const response = await fetch(MOCK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `Quote: ${quote.category}`,
        body: quote.text,
        userId: 1,
        quoteCategory: quote.category,
        localId: Date.now() // Simulate unique ID
      })
    });

    if (response.ok) {
      const serverResponse = await response.json();
      console.log("Quotes synced with server!" , serverResponse);
      return serverResponse;
    } else {
      throw new Error('Failed to sync quote to server');
    }
  } catch (error) {
    console.error('Error syncing quote to server:', error);
    // Store failed sync attempts for retry
    storeFailedSync(quote);
    return null;
  }
}

async function syncAllQuotesToServer() {
  console.log('Syncing all local quotes to server...');
  const syncPromises = quotes.map(quote => syncQuotes(quote));
  const results = await Promise.allSettled(syncPromises);
  
  const successfulSyncs = results.filter(result => result.status === 'fulfilled' && result.value !== null).length;
  const failedSyncs = results.filter(result => result.status === 'rejected').length;
  
  if (successfulSyncs > 0 || failedSyncs > 0) {
    showSyncNotification(`Sync completed: ${successfulSyncs} successful, ${failedSyncs} failed`);
  }
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(`${MOCK_API_URL}?_limit=5`);
    const serverData = await response.json();
    
    // Simulate quotes from server data
    const serverQuotes = serverData.map(post => ({
      text: post.body || `Server quote: ${post.title}`,
      category: post.quoteCategory || "Server",
      serverId: post.id,
      source: 'server'
    }));

    const newQuotes = [];
    const conflicts = [];

    serverQuotes.forEach(serverQuote => {
      const existingQuote = quotes.find(localQuote => 
        localQuote.text === serverQuote.text || localQuote.serverId === serverQuote.serverId
      );
      
      if (!existingQuote) {
        // New quote from server
        newQuotes.push(serverQuote);
      } else if (existingQuote.source !== 'server' && existingQuote.text !== serverQuote.text) {
        // Conflict detected
        conflicts.push({ local: existingQuote, server: serverQuote });
      }
    });
    

    if (newQuotes.length > 0) {
      quotes.push(...newQuotes);
      saveQuotes();
      populateCategories();
      showSyncNotification(`Added ${newQuotes.length} new quotes from server`);
    }
    

    if (conflicts.length > 0) {
      handleConflicts(conflicts);
    }
    
    return { newQuotes, conflicts };
  } catch (error) {
    console.error("Error fetching from server:", error);
    showSyncNotification('Error syncing with server');
    return { newQuotes: [], conflicts: [] };
  }
}

function handleConflicts(conflicts) {

    conflicts.forEach(conflict => {
    const index = quotes.findIndex(q => q.text === conflict.local.text);
    if (index !== -1) {
      quotes[index] = { ...conflict.server, resolved: true };
    }
  });
  
  saveQuotes();
  showRandomQuote();
  
  showSyncNotification(`Resolved ${conflicts.length} conflicts (server version kept)`);
}

function storeFailedSync(quote) {
  const failedSyncs = JSON.parse(localStorage.getItem('failedSyncs') || '[]');
  failedSyncs.push({
    quote,
    timestamp: new Date().toISOString(),
    attempt: 1
  });
  localStorage.setItem('failedSyncs', JSON.stringify(failedSyncs));
}

async function retryFailedSyncs() {
  const failedSyncs = JSON.parse(localStorage.getItem('failedSyncs') || '[]');
  if (failedSyncs.length === 0) return;
  
  const retryResults = [];
  
  for (const failedSync of failedSyncs) {
    try {
      const result = await syncQuotes(failedSync.quote);
      if (result) {
        retryResults.push({ success: true, quote: failedSync.quote });
      }
    } catch (error) {
      retryResults.push({ success: false, quote: failedSync.quote });
    }
  }
  
  const remainingFailures = failedSyncs.filter((_, index) => !retryResults[index].success);
  localStorage.setItem('failedSyncs', JSON.stringify(remainingFailures));
  
  showSyncNotification(`Retry completed: ${retryResults.filter(r => r.success).length} successful`);
}

function showSyncNotification(message) {

    let notification = document.getElementById('syncNotification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'syncNotification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 1000;
      max-width: 300px;
    `;
    document.body.appendChild(notification);
  }
  
  notification.textContent = message;
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

// Manual sync controls
function createSyncControls() {
  const syncContainer = document.createElement('div');
  syncContainer.className = 'controls';
  syncContainer.innerHTML = `
    <h2>Server Sync</h2>
    <button onclick="syncAllQuotesToServer()">Sync All to Server</button>
    <button onclick="fetchQuotesFromServer()">Fetch from Server</button>
    <button onclick="retryFailedSyncs()">Retry Failed Syncs</button>
    <div id="syncStatus"></div>
  `;
  
  const dataManagement = document.querySelector('.controls:last-child');
  dataManagement.parentNode.insertBefore(syncContainer, dataManagement);
}

// Initialize application
function init() {
  loadQuotes();
  
  // Create the form dynamically
  createAddQuoteForm();
  
  // Create sync controls
  createSyncControls();
  
  populateCategories();
  showRandomQuote();

  // Start periodic syncing
  setInterval(fetchQuotesFromServer, SYNC_INTERVAL);
  setInterval(retryFailedSyncs, SYNC_INTERVAL * 2);

  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  
  // Initial sync
  setTimeout(() => {
    fetchQuotesFromServer();
    syncAllQuotesToServer();
  }, 2000);
}

document.addEventListener('DOMContentLoaded', init);
