// Set Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1IjoiYXJnaG9tZXMiLCJhIjoiY2xxaTR4M2IxMWlsYzJxbWUxN3MzM3huOSJ9.O9N0vdbn8Re-n4_qP6NeiA";

// Function to get location data from the displayed elements on the page
const getLocationData = () => {
  // Select all elements with the class 'location' within the element with the id 'location-data'
  const locationElements = document.querySelectorAll(
    "#location-data .location"
  );
  const locations = [];

  // Iterate through each location element
  locationElements.forEach((element) => {
    // Extract location information from data attributes
    const id = element.getAttribute("data-id");
    const name = element.getAttribute("data-name");
    const address = element.getAttribute("data-address"); // Additional details property
    const origPrice = element.getAttribute("data-price");
    const price = parseFloat(origPrice.replace(/[^0-9.-]+/g, ""));
    const prop1 = element.getAttribute("data-prop1");
    const prop2 = element.getAttribute("data-prop2");
    const prop3 = element.getAttribute("data-prop3");
    const prop4 = element.getAttribute("data-prop4");
    const img = element.getAttribute("data-img");
    const lat = parseFloat(element.getAttribute("data-lat"));
    const lng = parseFloat(element.getAttribute("data-lng"));
    const cat = element.getAttribute("data-cat");
    const loc = element.getAttribute("data-loc");

    // Check if latitude and longitude are valid numbers before adding to locations array
    if (!isNaN(lat) && !isNaN(lng)) {
      locations.push({
        id,
        name,
        address,
        price,
        prop1,
        prop2,
        prop3,
        prop4,
        img,
        lat,
        lng,
        cat,
        loc,
      });
    }
  });

  return locations;
};

// Function to initialize the map
const initializeMap = () => {
  // Get location data
  const locations = getLocationData();

  // Check if there are no locations
  if (locations.length === 0) {
    console.error("No locations found.");
    return;
  }

  const parseURLParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlCategorySelect = searchParams.get("category") || "";
    const urlRangeSelect = parseFloat(searchParams.get("price")) || 0;

    return { urlCategorySelect, urlRangeSelect };
  };

  // Get filter values from URL parameters
  const { urlCategorySelect, urlRangeSelect } = parseURLParams();

  // Create a new Mapbox map
  const map = new mapboxgl.Map({
    container: "map", // Specify the container ID
    style: "mapbox://styles/mapbox/streets-v12", // Style URL
    center: [77.209, 28.6139], // Specify the initial center position [lng, lat]
    zoom: 8.5,
  });

  // Add navigation control to the map
  map.addControl(new mapboxgl.NavigationControl());

  // Function to update location cards based on visible bounds
  const updateLocationCards = () => {
    const visibleBounds = map.getBounds();

    // Get the selected category from the select field
    const categorySelect = document.getElementById("category-list").value;

    // Get the selected location from the select field
    const locationSelect = document.getElementById("location-list").value;

    // Get the selected range from the range slider
    const rangeSelect = document.getElementById("display-price").value;

    // Filter locations based on whether they are within the visible bounds of the map and match the selected category
    const visibleLocations = locations.filter(
      (location) =>
        location.lng >= visibleBounds.getWest() &&
        location.lng <= visibleBounds.getEast() &&
        location.lat >= visibleBounds.getSouth() &&
        location.lat <= visibleBounds.getNorth() &&
        ((urlCategorySelect === "" && categorySelect === "") ||
          (urlCategorySelect !== "" && location.cat === urlCategorySelect) ||
          (categorySelect !== "" && location.cat === categorySelect)) &&
        location.price >= rangeSelect &&
        location.price >= urlRangeSelect
    );

    // Update property cards based on visible locations
    updatePropertyCards(visibleLocations);

    // Add markers for filtered locations
    addMarkersToMap(visibleLocations);

    // Draw the circular boundary on visible locations
    drawCircularBoundary(map, visibleLocations);

    // Update result heading text
    const resultHeading = document.getElementById("display-result");
    if (visibleLocations.length === 1) {
      resultHeading.textContent = `${visibleLocations.length} Property Found`;
    } else {
      resultHeading.textContent = `${visibleLocations.length} Properties Found`;
    }
  };

  // Function to update property cards based on visible locations
  const updatePropertyCards = (visibleLocations) => {
    // Select all elements with the class 'property-card'
    const propertyCards = document.querySelectorAll(".property-card");

    // Iterate through each property card
    propertyCards.forEach((card) => {
      const cardId = card.getAttribute("data-id");
      // Check if the card's ID is in the array of visible locations
      const isVisible = visibleLocations.some(
        (location) => location.id === cardId
      );

      // Set the display style of the card based on visibility
      if (isVisible) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  };

  // Add event listeners for map movement and zoom changes
  map.on("move", updateLocationCards);
  map.on("zoom", updateLocationCards);

  // Add event listeners to filter elements
  document
    .getElementById("category-list")
    .addEventListener("change", updateLocationCards);
  document
    .getElementById("location-list")
    .addEventListener("change", updateLocationCards);
  document
    .getElementById("display-price")
    .addEventListener("change", updateLocationCards);

  const addMarkersToMap = (locations) => {
    // Clear existing markers
    document
      .querySelectorAll(".custom-marker")
      .forEach((marker) => marker.remove());

    // Add click event listener to each marker on the map
    locations.forEach((location) => {
      // HTML content for the popup associated with each marker
      const popupHtml = `
        <div class="popup-content">
          <h3>${location.name}</h3>
          <img src="${location.img}" alt="${location.name}" class="popup-image">
          <p class="popup-address">${location.address}</p>
          <p class="popup-price">Price: ${location.price}</p>
          <hr>
          <p class="popup-features-label">Features:</p>
          <p class="popup-features">
            <i class="fas fa-bath property-icon"></i>${location.prop1} &nbsp
            <i class="fas fa-bed property-icon"></i>${location.prop2} &nbsp
            <i class="fas fa-expand property-icon"></i>${location.prop3}
          </p>
        </div>
      `;

      // Create a custom marker element for each location
      const markerHtml = document.createElement("div");
      markerHtml.className = "custom-marker";
      markerHtml.innerHTML = `<i class="fa fa-home"></i>`; // Font Awesome booking home icon

      // Create a Mapbox marker for each location
      const marker = new mapboxgl.Marker(markerHtml)
        .setLngLat([location.lng, location.lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupHtml))
        .addTo(map);

      // Add click event listener to each marker
      marker.getElement().addEventListener("click", () => {
        map.flyTo({
          center: [location.lng, location.lat],
          zoom: 12,
        });
      });
    });
  };

  // Function to draw circular boundary around visible locations
  const drawCircularBoundary = (map, locations) => {
    // Check if there are visible locations
    if (locations.length === 0) {
      // Remove the circular boundary if it exists
      if (map.getSource("circular-boundary")) {
        map.removeLayer("circular-boundary-layer");
        map.removeSource("circular-boundary");
      }
      return; // Exit the function
    }
    // Calculate centroid of visible locations
    const points = locations.map((location) => [location.lng, location.lat]);
    const centroid = turf.centroid(turf.multiPoint(points));

    // Calculate circle around the centroid
    const options = {
      steps: 50,
      units: "kilometers",
    }; // Adjust steps and units as needed
    const circle = turf.circle(centroid, 10, options); // 10 km radius, adjust as needed

    // Draw the circular boundary on the map
    if (!map.getSource("circular-boundary")) {
      map.addSource("circular-boundary", {
        type: "geojson",
        data: circle,
      });
      map.addLayer({
        id: "circular-boundary-layer",
        type: "fill",
        source: "circular-boundary",
        paint: {
          "fill-color": "#0080ff",
          "fill-opacity": 0.3,
        },
      });
    } else {
      map.getSource("circular-boundary").setData(circle);
    }
  };
};

// Call the initializeMap function
initializeMap();
