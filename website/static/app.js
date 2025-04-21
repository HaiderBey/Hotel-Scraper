ocument.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const destinationFilter = document.getElementById('destination-filter');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const hotelsContainer = document.getElementById('hotels-container');
    const loadingElement = document.getElementById('loading');

    // Load hotels on page load
    loadHotels();

    // Add event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    applyFiltersBtn.addEventListener('click', handleSearch);

    function handleSearch() {
        loadHotels({
            name: searchInput.value,
            destination: destinationFilter.value,
            min_price: minPriceInput.value,
            max_price: maxPriceInput.value
        });
    }

    function loadHotels(filters = {}) {
        // Show loading indicator
        loadingElement.style.display = 'block';
        hotelsContainer.innerHTML = '';

        // Build query parameters
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.destination) params.append('destination', filters.destination);
        if (filters.min_price) params.append('min_price', filters.min_price);
        if (filters.max_price) params.append('max_price', filters.max_price);

        // Fetch hotels data from API
        fetch(`/api/hotels?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                // Hide loading indicator
                loadingElement.style.display = 'none';

                // If no hotels found
                if (!data.hotels || data.hotels.length === 0) {
                    hotelsContainer.innerHTML = '<p class="no-results">No hotels found matching your criteria.</p>';
                    return;
                }

                // Populate destinations dropdown if available and not already populated
                if (data.destinations && destinationFilter.options.length <= 1) {
                    populateDestinations(data.destinations);
                }

                // Display hotels
                displayHotels(data.hotels);
            })
            .catch(error => {
                console.error('Error fetching hotels:', error);
                loadingElement.style.display = 'none';
                hotelsContainer.innerHTML = '<p class="error">Error loading hotels. Please try again later.</p>';
            });
    }

    function populateDestinations(destinations) {
        destinationFilter.innerHTML = '<option value="">All Destinations</option>';
        destinations.forEach(destination => {
            const option = document.createElement('option');
            option.value = destination;
            option.textContent = destination.charAt(0).toUpperCase() + destination.slice(1); // Capitalize
            destinationFilter.appendChild(option);
        });
    }

    function displayHotels(hotels) {
        hotels.forEach(hotel => {
            const hotelCard = document.createElement('div');
            hotelCard.className = 'hotel-card';

            // Use a placeholder image if the hotel image is not available
            const imageUrl = hotel.Image && hotel.Image !== 'N/A' 
                ? hotel.Image 
                : 'https://dummyimage.com/250x200/ededed/404040.jpg&text=No+Image+Provided';

            hotelCard.innerHTML = `
                <img class="hotel-image" src="${imageUrl}" alt="${hotel.Name}">
                <div class="hotel-info">
                    <h2 class="hotel-name">${hotel.Name}</h2>
                    <p class="hotel-destination">
                        <i class="fas fa-map-marker-alt"></i> ${hotel.destination}
                    </p>
                    <p class="hotel-price">${hotel.Price}</p>
                    <a href="${hotel.Link}" class="hotel-link" target="_blank">View on TunisieBooking</a>
                </div>
            `;

            hotelsContainer.appendChild(hotelCard);
        });
    }
});