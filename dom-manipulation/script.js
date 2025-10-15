let quotes = [
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Inspiration" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "The only way to do great work is to love what you do.", category: "Work" },
  { text: "What we think, we become.", category: "Mindfulness" }
];

const MOCK_API_URL = "https://jsonplaceholder.typicode.com/posts"; 
const SYNC_INTERVAL = 60000; 

// Step 2: DOM Manipulation - Create form dynamically

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
    
    // Append all elements to form container

    formContainer.appendChild(heading);
    formContainer.appendChild(quoteInput);
    formContainer.appendChild(categoryInput);
    formContainer.appendChild(addButton);
    
    // Insert the form after the quote container

    const quoteContainer = document.querySelector('.quote-container');
    quoteContainer.parentNode.insertBefore(formContainer, quoteContainer.nextSibling);
}

function addQuote() {
  const newQuoteText = document.getElementById('newQuoteText').value;
  const newQuoteCategory = document.getElementById('newQuoteCategory').value;

  if (newQuoteText && newQuoteCategory) {
    quotes.push({ text: newQuoteText, category: newQuoteCategory });
    saveQuotes();

    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    
    populateCategories();
    showRandomQuote();
    
    alert('Quote added successfully!');
  } else {
    alert('Please enter both a quote and a category.');
  }
}

// Web Storage functions

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

// Quote display and filtering

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
    
    // Use session storage to save the last viewed quote

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
      alert('Quotes imported successfully!');
    } catch (error) {
      alert('Error parsing JSON file. Please ensure the format is correct.');
    }
  };
  fileReader.readAsText(file);
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(MOCK_API_URL);
    const serverData = await response.json();
    

    const serverQuotes = serverData.slice(0, 10).map(post => ({
      text: post.body.substring(0, 100) + "...",
      category: "Server"
    }));

    const newQuotes = [];
    serverQuotes.forEach(serverQuote => {
      const isNew = !quotes.some(localQuote => localQuote.text === serverQuote.text);
      if (isNew) {
        newQuotes.push(serverQuote);
      }
    });
    
    if (newQuotes.length > 0) {
      quotes.push(...newQuotes);
      saveQuotes();
      populateCategories();
      showRandomQuote();
      alert(`New quotes synced from server! Added ${newQuotes.length} new quotes.`);
    } else {
      console.log('No new quotes from server.');
    }
  } catch (error) {
    console.error("Error syncing with server:", error);
  }
}

function init() {
  loadQuotes();

  createAddQuoteForm();
  
  populateCategories();
  showRandomQuote();

  setInterval(fetchQuotesFromServer, SYNC_INTERVAL);

  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
}

document.addEventListener('DOMContentLoaded', init);
