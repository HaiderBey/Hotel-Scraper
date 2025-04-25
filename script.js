 // Global variables
 let hotelsData = [];
 let filteredData = [];
 
 // DOM elements
 const csvFileInput = document.getElementById('csvFile');
 const loadCsvBtn = document.getElementById('loadCsvBtn');
 const dataStatus = document.getElementById('dataStatus');
 const searchInput = document.getElementById('searchInput');
 const destinationFilter = document.getElementById('destinationFilter');
 const minPriceInput = document.getElementById('minPrice');
 const maxPriceInput = document.getElementById('maxPrice');
 const minRatingSelect = document.getElementById('minRating');
 const searchBtn = document.getElementById('searchBtn');
 const resultsContainer = document.getElementById('results');
 const importToggle = document.getElementById('importToggle');
 const manualImport = document.getElementById('manualImport');
 
 // Event listeners
 loadCsvBtn.addEventListener('click', () => loadCsvFromFile());
 searchBtn.addEventListener('click', searchHotels);
 importToggle.addEventListener('click', toggleManualImport);
 
 // Toggle manual import section
 function toggleManualImport() {
     manualImport.classList.toggle('hidden');
     importToggle.textContent = manualImport.classList.contains('hidden') 
         ? 'Show manual import options' 
         : 'Hide manual import options';
 }
 
 // Auto-load CSV on page load
 document.addEventListener('DOMContentLoaded', () => {
     // Find the most recent CSV file in the data directory
     findMostRecentCsvFile();
 });
 
 // Find the most recent CSV file
 function findMostRecentCsvFile() {
     // Look in the data directory for CSV files
     const dataDir = 'data/';
     
     // Try to find CSV files in the data directory
     fetch(dataDir)
         .then(response => {
             // If we can access the directory (which usually isn't possible in browsers)
             // This is more of a fallback that won't typically work
             console.log("Directory listing not supported in browsers. Using default file path.");
             loadDefaultCsvFile();
         })
         .catch(error => {
             // If we can't access the directory, try a default file
             console.log("Error accessing directory, using default file path:", error);
             loadDefaultCsvFile();
         });
 }
 
 // Load the default CSV file
 function loadDefaultCsvFile() {
     // Try to find the most recent file based on a pattern
     // This assumes files are named like: tunisie_booking_hotels_YYYYMMDD_HHMM.csv
     const today = new Date();
     const yesterday = new Date(today);
     yesterday.setDate(yesterday.getDate() - 1);
     
     // Try today's date first, then yesterday
     tryLoadCsvWithDate(today) || tryLoadCsvWithDate(yesterday) || tryLoadFallbackCsv();
 }
 
 // Try to load CSV with a specific date
 function tryLoadCsvWithDate(date) {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     
     const dateStr = `${year}${month}${day}`;
     const filePath = `data/tunisie_booking_hotels_${dateStr}_*.csv`;
     
     // Since we can't use wildcards in fetch, try a few common times
     const commonTimes = ['0000', '0800', '1200', '1600', '2000'];
     
     let loaded = false;
     for (const time of commonTimes) {
         const exactPath = `data/tunisie_booking_hotels_${dateStr}_${time}.csv`;
         if (tryLoadSpecificCsv(exactPath)) {
             loaded = true;
             break;
         }
     }
     
     return loaded;
 }
 
 // Try to load a specific CSV file
 function tryLoadSpecificCsv(filePath) {
     fetch(filePath)
         .then(response => {
             if (!response.ok) {
                 throw new Error(`HTTP error! Status: ${response.status}`);
             }
             return response.text();
         })
         .then(data => {
             processCsvData(data, filePath);
             return true;
         })
         .catch(error => {
             console.log(`Error loading ${filePath}:`, error);
             return false;
         });
         
     // We return true optimistically - the actual result will be handled in the promise
     return true;
 }
 
 // Try to load any CSV file as a fallback
 function tryLoadFallbackCsv() {
     // Look for any CSV file in the data directory
     const possibleFiles = [
         'data/latest_hotels.csv',
         'data/tunisie_booking_hotels.csv',
         'data/hotels_data.csv',
         'tunisie_booking_hotels.csv',
         'hotels_data.csv'
     ];
     
     let loaded = false;
     for (const file of possibleFiles) {
         if (tryLoadSpecificCsv(file)) {
             loaded = true;
             break;
         }
     }
     
     if (!loaded) {
         dataStatus.textContent = 'No CSV file found. Please import one manually.';
         manualImport.classList.remove('hidden');
         importToggle.textContent = 'Hide manual import options';
     }
     
     return loaded;
 }
 
 // Load CSV from file input
 function loadCsvFromFile() {
     const file = csvFileInput.files[0];
     if (!file) {
         alert('Please select a CSV file first');
         return;
     }
     
     const reader = new FileReader();
     reader.onload = function(e) {
         processCsvData(e.target.result, file.name);
     };
     
     reader.readAsText(file);
 }
 
 // Process CSV data
 function processCsvData(csvText, fileName) {
     try {
         hotelsData = parseCSV(csvText);
         dataStatus.textContent = `Loaded ${hotelsData.length} hotels from ${fileName || 'file'}`;
         
         // Populate destination filter
         populateDestinationFilter();
         
         // Show all hotels initially
         filteredData = [...hotelsData];
         displayResults();
     } catch (error) {
         console.error('Error parsing CSV:', error);
         dataStatus.textContent = 'Error loading data. Please check the CSV format.';
     }
 }
 
 // Parse CSV data
 function parseCSV(text) {
     const lines = text.split('\n');
     const headers = lines[0].split(',').map(header => header.trim().replace(/^"(.*)"$/, '$1'));
     
     const data = [];
     for (let i = 1; i < lines.length; i++) {
         if (lines[i].trim() === '') continue;
         
         // Handle commas within quoted fields
         const values = [];
         let currentValue = '';
         let insideQuotes = false;
         
         for (let char of lines[i]) {
             if (char === '"') {
                 insideQuotes = !insideQuotes;
             } else if (char === ',' && !insideQuotes) {
                 values.push(currentValue.trim().replace(/^"(.*)"$/, '$1'));
                 currentValue = '';
             } else {
                 currentValue += char;
             }
         }
         values.push(currentValue.trim().replace(/^"(.*)"$/, '$1'));
         
         const row = {};
         headers.forEach((header, index) => {
             row[header] = values[index] || '';
         });
         
         data.push(row);
     }
     
     return data;
 }
 
 // Populate destination filter dropdown
 function populateDestinationFilter() {
     const destinations = new Set();
     hotelsData.forEach(hotel => {
         if (hotel.Destination) {
             destinations.add(hotel.Destination);
         }
     });
     
     // Clear existing options except the first one
     while (destinationFilter.options.length > 1) {
         destinationFilter.remove(1);
     }
     
     // Add new options
     destinations.forEach(destination => {
         const option = document.createElement('option');
         option.value = destination;
         option.textContent = destination;
         destinationFilter.appendChild(option);
     });
 }
 
 // Search hotels based on filters
 function searchHotels() {
     const searchTerm = searchInput.value.toLowerCase();
     const destination = destinationFilter.value;
     const minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : 0;
     const maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : Infinity;
     const minRating = minRatingSelect.value ? parseFloat(minRatingSelect.value) : 0;
     
     filteredData = hotelsData.filter(hotel => {
         // Search by name
         const nameMatch = hotel.Name.toLowerCase().includes(searchTerm);
         
         // Filter by destination
         const destinationMatch = !destination || hotel.Destination === destination;
         
         // Filter by price
         let priceMatch = true;
         if (hotel.Price && hotel.Price !== 'N/A') {
             const priceValue = parseFloat(hotel.Price.replace(/[^\d.]/g, ''));
             priceMatch = !isNaN(priceValue) && priceValue >= minPrice && priceValue <= maxPrice;
         }
         
         // Filter by rating
         let ratingMatch = true;
         if (minRating > 0) {
             const ratingValue = parseFloat(hotel.Rate);
             ratingMatch = !isNaN(ratingValue) && ratingValue >= minRating;
         }
         
         return nameMatch && destinationMatch && priceMatch && ratingMatch;
     });
     
     displayResults();
 }
 
 // Display results
 function displayResults() {
     if (filteredData.length === 0) {
         resultsContainer.innerHTML = '<div class="no-results">No hotels found matching your criteria</div>';
         return;
     }
     
     let html = '';
     filteredData.forEach(hotel => {
         const imageUrl = hotel.Image && hotel.Image !== 'N/A' 
             ? hotel.Image 
             : 'https://dummyimage.com/300x200/ededed/404040.jpg&text=No+Image';
         
         html += `
             <div class="hotel-card">
                 <div class="hotel-image" style="background-image: url('${imageUrl}')"></div>
                 <div class="hotel-info">
                     <div class="hotel-name">${hotel.Name}</div>
                     <div class="hotel-destination">${hotel.Destination || 'Unknown location'}</div>
                     <div class="hotel-price">${hotel.Price || 'Price not available'}</div>
                     ${hotel.Rate && hotel.Rate !== 'N/A' 
                         ? `<div class="hotel-rating">${hotel.Rate} / 5</div>` 
                         : '<div class="hotel-rating">No rating</div>'}
                     <a href="${hotel.Link}" target="_blank" class="hotel-link">View Hotel</a>
                 </div>
             </div>
         `;
     });
     
     resultsContainer.innerHTML = html;
 }