 // Global variables
let hotelsData = [];
let filteredData = [];

// DOM elements
const searchInput = document.getElementById('searchInput');
const destinationFilter = document.getElementById('destinationFilter');
const minPriceInput = document.getElementById('minPrice');
const maxPriceInput = document.getElementById('maxPrice');
const minRatingSelect = document.getElementById('minRating');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results');
const dataStatus = document.getElementById('dataStatus');

// Event listeners
searchBtn.addEventListener('click', searchHotels);

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadHotelData();
});

// Load hotel data from Flask API
function loadHotelData() {
    dataStatus.textContent = 'Loading hotel data...';
    
    fetch('/api/hotels')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                dataStatus.textContent = data.error;
                return;
            }
            
            hotelsData = data.hotels;
            dataStatus.textContent = `Loaded ${hotelsData.length} hotels`;
            
            // Populate destination filter
            populateDestinationFilter(data.destinations);
            
            // Show all hotels initially
            filteredData = [...hotelsData];
            displayResults();
        })
        .catch(error => {
            console.error('Error loading hotel data:', error);
            dataStatus.textContent = 'Error loading hotel data. Please try again later.';
        });
}

// Populate destination filter dropdown
function populateDestinationFilter(destinations) {
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
        const destinationMatch = !destination || (hotel.Destination && hotel.Destination.toLowerCase().includes(destination.toLowerCase()));
        
        // Filter by price
        let priceMatch = true;
        if (hotel.Price && hotel.Price !== 'N/A') {
            const priceStr = hotel.Price.toString();
            const priceValue = parseFloat(priceStr.replace(/[^\d.]/g, ''));
            priceMatch = !isNaN(priceValue) && priceValue >= minPrice && priceValue <= maxPrice;
        }
        
        // Filter by rating
        let ratingMatch = true;
        if (minRating > 0 && hotel.Rate) {
            const rateStr = hotel.Rate.toString();
            const rateValue = parseFloat(rateStr);
            ratingMatch = !isNaN(rateValue) && rateValue >= minRating;
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
                    <div class="hotel-price">${"Starting from: " + hotel.Price + " TND" || 'Price not available'}</div>
                    ${hotel.Rate && hotel.Rate !== 'N/A' 
                        ? `<div class="hotel-rating">${"Tripadvisor Rating: " + hotel.Rate} / 5</div>` 
                        : '<div class="hotel-rating">No rating</div>'}
                    <a href="${hotel.Link}" target="_blank" class="hotel-link">View Hotel</a>
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}