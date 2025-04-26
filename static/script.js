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
    initializeAnimations()
    loadHotelData();
});

function initializeAnimations() {
    // Add subtle animation to the search button
    searchBtn.addEventListener("mouseover", () => {
      searchBtn.style.transform = "translateY(-2px)"
    })
  
    searchBtn.addEventListener("mouseout", () => {
      searchBtn.style.transform = "translateY(0)"
    })
  
    // Add subtle animation to input fields
    const inputs = document.querySelectorAll("input, select")
    inputs.forEach((input) => {
      input.addEventListener("focus", () => {
        input.style.borderColor = "#c8a45c"
        input.style.boxShadow = "0 0 0 2px rgba(200, 164, 92, 0.2)"
      })
  
      input.addEventListener("blur", () => {
        input.style.borderColor = "#e0dcd0"
        input.style.boxShadow = "none"
      })
    })
  }

// Load hotel data from Flask API
function loadHotelData() {
    dataStatus.textContent = 'iscovering luxury accommodations...';
    resultsContainer.innerHTML = '<div class="loading-message">Curating your luxury experience...</div>'

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
            dataStatus.textContent = `${hotelsData.length} exceptional properties found`;
            
            // Populate destination filter
            populateDestinationFilter(data.destinations);
            
            // Show all hotels initially
            filteredData = [...hotelsData];
            displayResults();
            
            setTimeout(() => {
                const hotelCards = document.querySelectorAll(".hotel-card")
                hotelCards.forEach((card, index) => {
                  setTimeout(() => {
                    card.style.opacity = "1"
                    card.style.transform = "translateY(0)"
                  }, index * 100)
                })
              }, 300)

        })
        .catch(error => {
            console.error('Error loading hotel data:', error);
            dataStatus.textContent = 'Unable to retrieve properties at this time. Please try again later.';
            resultsContainer.innerHTML = '<div class="no-results">We apologize, but we are currently unable to display our collection of luxury properties. Please try again later.</div>'
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
    
    searchBtn.disabled = true
    searchBtn.innerHTML = "<span>Searching...</span>"
    resultsContainer.innerHTML = '<div class="loading-message">Finding your perfect stay...</div>'

    setTimeout(() => {
        filteredData = hotelsData.filter((hotel) => {
          // Search by name
          const nameMatch = hotel.Name.toLowerCase().includes(searchTerm)
    
          // Filter by destination
          const destinationMatch =
            !destination || (hotel.Destination && hotel.Destination.toLowerCase().includes(destination.toLowerCase()))
    
          // Filter by price
          let priceMatch = true
          if (hotel.Price && hotel.Price !== "N/A") {
            const priceStr = hotel.Price.toString()
            const priceValue = Number.parseFloat(priceStr.replace(/[^\d.]/g, ""))
            priceMatch = !isNaN(priceValue) && priceValue >= minPrice && priceValue <= maxPrice
          }
    
          // Filter by rating
          let ratingMatch = true
          if (minRating > 0 && hotel.Rate) {
            const rateStr = hotel.Rate.toString()
            const rateValue = Number.parseFloat(rateStr)
            ratingMatch = !isNaN(rateValue) && rateValue >= minRating
          }
    
          return nameMatch && destinationMatch && priceMatch && ratingMatch
        })
    
        displayResults()
    
        // Reset button state
        searchBtn.disabled = false
        searchBtn.innerHTML = "<span>Search Hotels</span>"
    
        // Scroll to results
        document.querySelector(".results-container").scrollIntoView({ behavior: "smooth", block: "start" })
      }, 800)
}

// Display resultse
function displayResults() {
    if (filteredData.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No properties match your refined criteria. Please adjust your search parameters.</div>';
        return;
    }
    
    let html = ""
    filteredData.forEach((hotel) => {
      const imageUrl =
        hotel.Image && hotel.Image !== "N/A"
          ? hotel.Image
          : "https://dummyimage.com/600x400/e0dcd0/333333.jpg&text=Wetla+Hotels"
  
      html += `
              <div class="hotel-card" style="opacity: 0; transform: translateY(20px);">
                  <div class="hotel-image" style="background-image: url('${imageUrl}')"></div>
                  <div class="hotel-info">
                      <h3 class="hotel-name">${hotel.Name}</h3>
                      <div class="hotel-destination">${hotel.Destination || "Exclusive Location"}</div>
                      <div class="hotel-price">${hotel.Price ? "From " + hotel.Price + " TND per night" : "Price on request"}</div>
                      ${
                        hotel.Rate && hotel.Rate !== "N/A"
                          ? `<div class="hotel-rating">${hotel.Rate} / 5 Exceptional</div>`
                          : '<div class="hotel-rating">Newly Listed</div>'
                      }
                      <a href="${hotel.Link}" target="_blank" class="hotel-link">View Property</a>
                  </div>
              </div>
          `
    })
    
    resultsContainer.innerHTML = html;

    setTimeout(() => {
        const hotelCards = document.querySelectorAll(".hotel-card")
        hotelCards.forEach((card, index) => {
          setTimeout(() => {
            card.style.opacity = "1"
            card.style.transform = "translateY(0)"
          }, index * 100)
        })
      }, 100)
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      })
    })
  })