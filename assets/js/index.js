const NASA_API_KEY = "bU7WaOFtMVnWeJGvbySkFHQt5WestD49c69xOgQa";
const NASA_APOD_URL = "https://api.nasa.gov/planetary/apod";
const LAUNCHES_API_URL =
  "https://lldev.thespacedevs.com/2.3.0/launches/upcoming/";


let allPlanets = [];
let allLaunches = [];


async function loadAstronomyPictureOfTheDay(selectedDate = null) {
  try {
   
    let apodUrl = `${NASA_APOD_URL}?api_key=${NASA_API_KEY}`;
    if (selectedDate) {
      apodUrl += `&date=${selectedDate}`;
    }

    const response = await fetch(apodUrl);
    const apodData = await response.json();

    const imageContainer = document.getElementById("apod-image-container");
    const loadingSpinner = document.getElementById("apod-loading");
    const imageElement = document.getElementById("apod-image");

    
    loadingSpinner.classList.remove("hidden");
    imageElement.classList.add("hidden");
    imageElement.src = "";

    
    const oldOverlay = imageContainer.querySelector(".absolute.inset-0");
    if (oldOverlay && oldOverlay !== loadingSpinner) {
      oldOverlay.remove();
    }

  
    const formattedDate = new Date(apodData.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    document.getElementById("apod-date").textContent =
      `Astronomy Picture of the Day - ${formattedDate}`;
    document.getElementById("apod-date-detail").innerHTML =
      `<i class="far fa-calendar mr-2"></i>${formattedDate}`;
    document.getElementById("apod-date-info").textContent = formattedDate;
    document.getElementById("apod-title").textContent = apodData.title;
    document.getElementById("apod-explanation").textContent =
      apodData.explanation;

    const copyrightElement = document.getElementById("apod-copyright");
    if (apodData.copyright) {
      copyrightElement.innerHTML = `<i class="fas fa-copyright mr-1"></i>Copyright: ${apodData.copyright.trim()}`;
      copyrightElement.classList.remove("hidden");
    } else {
      copyrightElement.classList.add("hidden");
    }

    document.getElementById("apod-media-type").textContent =
      apodData.media_type === "image" ? "Image" : "Video";

    if (apodData.media_type === "image") {
 
      imageElement.src = apodData.url;
      imageElement.alt = apodData.title;

      imageElement.onload = () => {
        loadingSpinner.classList.add("hidden");
        imageElement.classList.remove("hidden");
      };

      imageElement.onerror = () => {
        loadingSpinner.innerHTML = `
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-slate-400">Failed to load image</p>
        `;
      };

    
      const fullResOverlay = document.createElement("div");
      fullResOverlay.className =
        "absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity";
      fullResOverlay.innerHTML = `
        <div class="absolute bottom-6 left-6 right-6">
          <a href="${apodData.hdurl || apodData.url}" target="_blank" class="block w-full py-3 bg-white/10 backdrop-blur-md rounded-lg font-semibold hover:bg-white/20 transition-colors text-center">
            <i class="fas fa-expand mr-2"></i>View Full Resolution
          </a>
        </div>
      `;
      imageContainer.appendChild(fullResOverlay);
    } else if (apodData.media_type === "video") {
      
      loadingSpinner.classList.add("hidden");
      imageContainer.innerHTML = `
        <iframe
          src="${apodData.url}"
          class="w-full h-full"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `;
    }
  } catch (error) {
    console.error("Error fetching APOD:", error);
    document.getElementById("apod-loading").innerHTML = `
      <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
      <p class="text-slate-400">Failed to load today's image</p>
      <p class="text-slate-500 text-sm mt-2">Please try again later</p>
    `;
  }
}


async function loadPlanetsData() {
  try {
    const response = await fetch(
      "https://solar-system-opendata-proxy.vercel.app/api/planets",
    );
    const data = await response.json();

    allPlanets = data.bodies.filter((body) => body.isPlanet === true);

    renderPlanetsGrid();
    renderPlanetComparisonTable();

 
    const earthPlanet = allPlanets.find(
      (planet) => planet.englishName.toLowerCase() === "earth",
    );
    if (earthPlanet) {
      showPlanetDetails(earthPlanet);
    }
  } catch (error) {
    console.error("Error fetching planets data:", error);
    const planetsGrid = document.getElementById("planets-grid");
    if (planetsGrid) {
      planetsGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
          <p class="text-slate-400">Failed to load planets data. Please try again later.</p>
        </div>
      `;
    }
  }
}


async function loadUpcomingLaunches() {
  try {
    const response = await fetch(`${LAUNCHES_API_URL}?limit=10`);
    const data = await response.json();
    allLaunches = data.results;

    const launchesCountDesktop = document.getElementById("launches-count");
    const launchesCountMobile = document.getElementById(
      "launches-count-mobile",
    );

    if (launchesCountDesktop) {
      launchesCountDesktop.textContent = `${allLaunches.length} Launches`;
    }
    if (launchesCountMobile) {
      launchesCountMobile.textContent = `${allLaunches.length}`;
    }

    renderFeaturedLaunch();
    renderLaunchesGrid();
  } catch (error) {
    console.error("Error fetching launches data:", error);
    const featuredLaunchSection = document.getElementById("featured-launch");
    const launchesGrid = document.getElementById("launches-grid");
    const errorMessage = `
      <div class="col-span-full text-center py-12">
        <i class="fas fa-exclamation-triangle text-red-400 text-5xl mb-4"></i>
        <p class="text-slate-400 text-lg">Failed to load launches data</p>
        <p class="text-slate-500 text-sm mt-2">Please try again later</p>
      </div>
    `;
    if (featuredLaunchSection) featuredLaunchSection.innerHTML = errorMessage;
    if (launchesGrid) launchesGrid.innerHTML = errorMessage;
  }
}


function getStatusColor(statusAbbrev) {
  const statusColors = {
    Go: "green",
    Success: "green",
    TBD: "yellow",
    Hold: "red",
    TBC: "yellow",
  };
  return statusColors[statusAbbrev] || "blue";
}


function renderFeaturedLaunch() {
  const featuredLaunchSection = document.getElementById("featured-launch");
  if (!featuredLaunchSection || allLaunches.length === 0) return;

  const nextLaunch = allLaunches[0];
  const launchDate = new Date(nextLaunch.net);
  const millisecondsUntilLaunch = launchDate - new Date();
  const daysUntilLaunch = Math.ceil(
    millisecondsUntilLaunch / (1000 * 60 * 60 * 24),
  );

  const formattedDate = launchDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime =
    launchDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC";

  const statusAbbrev = nextLaunch.status ? nextLaunch.status.abbrev : undefined;
  const statusColor = getStatusColor(statusAbbrev);

  const launchImageUrl =
    (nextLaunch.image && nextLaunch.image.image_url) ||
    (nextLaunch.rocket &&
      nextLaunch.rocket.configuration &&
      nextLaunch.rocket.configuration.image_url) ||
    "";

  const providerName = nextLaunch.launch_service_provider
    ? nextLaunch.launch_service_provider.name
    : "Unknown";

  const rocketName =
    nextLaunch.rocket && nextLaunch.rocket.configuration
      ? nextLaunch.rocket.configuration.name
      : "N/A";

  const padLocationName =
    nextLaunch.pad && nextLaunch.pad.location
      ? nextLaunch.pad.location.name
      : "Unknown";

  const countryName =
    nextLaunch.pad && nextLaunch.pad.location && nextLaunch.pad.location.country
      ? nextLaunch.pad.location.country.name
      : "Unknown";

  const missionDescription = nextLaunch.mission
    ? nextLaunch.mission.description
    : "Mission details will be available closer to launch date.";


  let countdownHtml = "";
  if (daysUntilLaunch > 0) {
    countdownHtml = `
      <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
        <i class="fas fa-clock text-2xl text-blue-400"></i>
        <div>
          <p class="text-2xl font-bold text-blue-400">${daysUntilLaunch}</p>
          <p class="text-xs text-slate-400">Days Until Launch</p>
        </div>
      </div>
    `;
  }

 
  let imageHtml = "";
  if (launchImageUrl) {
    imageHtml = `
      <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
        <img src="${launchImageUrl}" alt="${nextLaunch.name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='assets/images/launch-placeholder.png';" />
        <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
      </div>
    `;
  } else {
    imageHtml = `
      <div class="flex items-center justify-center h-full min-h-[400px] bg-slate-900/50 rounded-2xl">
        <div class="text-center">
          <i class="fas fa-rocket text-6xl text-slate-700 mb-4"></i>
          <p class="text-slate-500">No image available</p>
        </div>
      </div>
    `;
  }

  featuredLaunchSection.innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="absolute inset-0 bg-linear-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-star"></i>
                Featured Launch
              </span>
              <span class="px-4 py-1.5 bg-${statusColor}-500/20 text-${statusColor}-400 rounded-full text-sm font-semibold">
                ${statusAbbrev || "TBD"}
              </span>
            </div>

            <h3 class="text-3xl font-bold mb-3 leading-tight">${nextLaunch.name}</h3>

            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2">
                <i class="fas fa-building"></i>
                <span>${providerName}</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="fas fa-rocket"></i>
                <span>${rocketName}</span>
              </div>
            </div>

            ${countdownHtml}

            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-calendar"></i>
                  Launch Date
                </p>
                <p class="font-semibold">${formattedDate}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-clock"></i>
                  Launch Time
                </p>
                <p class="font-semibold">${formattedTime}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-map-marker-alt"></i>
                  Location
                </p>
                <p class="font-semibold text-sm">${padLocationName}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2">
                  <i class="fas fa-globe"></i>
                  Country
                </p>
                <p class="font-semibold">${countryName}</p>
              </div>
            </div>

            <p class="text-slate-300 leading-relaxed mb-6">
              ${missionDescription}
            </p>
          </div>

          <div class="flex flex-col md:flex-row gap-3">
            <button class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2">
              <i class="fas fa-info-circle"></i>
              View Full Details
            </button>
            <div class="icons self-end md:self-center">
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
                <i class="far fa-heart"></i>
              </button>
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors">
                <i class="fas fa-bell"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="relative">
          ${imageHtml}
        </div>
      </div>
    </div>
  `;
}


function renderLaunchesGrid() {
  const launchesGrid = document.getElementById("launches-grid");
  if (!launchesGrid || allLaunches.length === 0) return;

  const remainingLaunches = allLaunches.slice(1, 10);

  launchesGrid.innerHTML = remainingLaunches
    .map((launch) => {
      const launchDate = new Date(launch.net);
      const formattedDate = launchDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const formattedTime =
        launchDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        }) + " UTC";

      const statusAbbrev = launch.status ? launch.status.abbrev : undefined;
      const statusColor = getStatusColor(statusAbbrev);
      const thumbnailUrl = launch.image ? launch.image.thumbnail_url : "";

      const providerName = launch.launch_service_provider
        ? launch.launch_service_provider.name
        : "Unknown";
      const rocketName =
        launch.rocket && launch.rocket.configuration
          ? launch.rocket.configuration.name
          : "N/A";
      const padLocationName =
        launch.pad && launch.pad.location
          ? launch.pad.location.name
          : "Unknown";

      
      let headerHtml = "";
      if (thumbnailUrl) {
        headerHtml = `
          <div class="relative h-48 overflow-hidden bg-slate-900/50">
            <img src="${thumbnailUrl}" alt="${launch.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.onerror=null; this.src='assets/images/launch-placeholder.png';" />
            <div class="absolute top-3 right-3">
              <span class="px-3 py-1 bg-${statusColor}-500/90 text-white backdrop-blur-sm rounded-full text-xs font-semibold">
                ${statusAbbrev || "TBD"}
              </span>
            </div>
          </div>
        `;
      } else {
        headerHtml = `
          <div class="relative h-48 bg-slate-900/50 flex items-center justify-center">
            <i class="fas fa-rocket text-5xl text-slate-700"></i>
            <div class="absolute top-3 right-3">
              <span class="px-3 py-1 bg-${statusColor}-500/90 text-white backdrop-blur-sm rounded-full text-xs font-semibold">
                ${statusAbbrev || "TBD"}
              </span>
            </div>
          </div>
        `;
      }

      return `
        <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
          ${headerHtml}
          <div class="p-5">
            <div class="mb-3">
              <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                ${launch.name}
              </h4>
              <p class="text-sm text-slate-400 flex items-center gap-2">
                <i class="fas fa-building text-xs"></i>
                ${providerName}
              </p>
            </div>

            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2 text-sm">
                <i class="fas fa-calendar text-slate-500 w-4"></i>
                <span class="text-slate-300">${formattedDate}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <i class="fas fa-clock text-slate-500 w-4"></i>
                <span class="text-slate-300">${formattedTime}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <i class="fas fa-rocket text-slate-500 w-4"></i>
                <span class="text-slate-300">${rocketName}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <i class="fas fa-map-marker-alt text-slate-500 w-4"></i>
                <span class="text-slate-300 line-clamp-1">${padLocationName}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
              <button class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">
                Details
              </button>
              <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                <i class="far fa-heart"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}




const PLANET_COLORS = {
  mercury: "#eab308",
  venus: "#f97316",
  earth: "#3b82f6",
  mars: "#ef4444",
  jupiter: "#fb923c",
  saturn: "#facc15",
  uranus: "#06b6d4",
  neptune: "#2563eb",
};

const PLANET_IMAGES = {
  mercury: "assets/images/mercury.png",
  venus: "assets/images/venus.png",
  earth: "assets/images/earth.png",
  mars: "assets/images/mars.png",
  jupiter: "assets/images/jupiter.png",
  saturn: "assets/images/saturn.png",
  uranus: "assets/images/uranus.png",
  neptune: "assets/images/neptune.png",
};


const KM_PER_AU = 149597870.7;

function renderPlanetsGrid() {
  const planetsGrid = document.getElementById("planets-grid");
  if (!planetsGrid) return;

  planetsGrid.innerHTML = allPlanets
    .map((planet) => {
      const planetKey = planet.englishName.toLowerCase();
      const planetColor = PLANET_COLORS[planetKey] || "#64748b";
      const planetImage = PLANET_IMAGES[planetKey] || "";
      const distanceInAU = (planet.semimajorAxis / KM_PER_AU).toFixed(2);

      return `
        <div class="planet-card bg-slate-800/50 border border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group" data-planet-id="${planet.id}" style="--planet-color: ${planetColor}" onmouseover="this.style.borderColor='${planetColor}80'" onmouseout="this.style.borderColor='#334155'">
          <div class="relative mb-3 h-24 flex items-center justify-center">
            <img class="w-20 h-20 object-contain group-hover:scale-110 transition-transform"
                 src="${planetImage}"
                 alt="${planet.englishName}" />
          </div>
          <h4 class="font-semibold text-center text-sm">${planet.englishName}</h4>
          <p class="text-xs text-slate-400 text-center">${distanceInAU} AU</p>
        </div>
      `;
    })
    .join("");


  document.querySelectorAll(".planet-card").forEach((card) => {
    card.addEventListener("click", function () {
      const planetId = this.dataset.planetId;
      const clickedPlanet = allPlanets.find((planet) => planet.id === planetId);
      if (clickedPlanet) {
        showPlanetDetails(clickedPlanet);
      }
    });
  });
}

function renderPlanetComparisonTable() {
  const tableBody = document.getElementById("planet-comparison-tbody");
  if (!tableBody) return;

 
  const tableColors = {
    mercury: "#6b7280",
    venus: "#fb923c",
    earth: "#3b82f6",
    mars: "#ef4444",
    jupiter: "#fdba74",
    saturn: "#fde047",
    uranus: "#22d3ee",
    neptune: "#2563eb",
  };


  const earthPlanet = allPlanets.find(
    (planet) => planet.englishName.toLowerCase() === "earth",
  );
  const earthMassData = earthPlanet ? earthPlanet.mass : null;
  const earthMassInKg = earthMassData
    ? earthMassData.massValue * Math.pow(10, earthMassData.massExponent)
    : 1;

  tableBody.innerHTML = allPlanets
    .map((planet) => {
      const planetKey = planet.englishName.toLowerCase();
      const rowColor = tableColors[planetKey] || "slate-500";

      const distanceInAU = (planet.semimajorAxis / KM_PER_AU).toFixed(2);
      const diameterInKm = (planet.meanRadius * 2).toFixed(0);

      const planetMassInKg = planet.mass
        ? planet.mass.massValue * Math.pow(10, planet.mass.massExponent)
        : 0;
      const massComparedToEarth = (planetMassInKg / earthMassInKg).toFixed(3);

    
      let orbitalPeriodText = planet.sideralOrbit.toFixed(0);
      if (planet.sideralOrbit > 365) {
        orbitalPeriodText = `${(planet.sideralOrbit / 365.25).toFixed(1)} years`;
      } else {
        orbitalPeriodText = `${orbitalPeriodText} days`;
      }

      const moonCount = planet.moons ? planet.moons.length : 0;

      
      let planetType = "Terrestrial";
      let badgeBackground = "#f9731680";
      let badgeTextColor = "#fb923c";

      if (["jupiter", "saturn"].includes(planetKey)) {
        planetType = "Gas Giant";
        badgeBackground = "#a855f780";
        badgeTextColor = "#c084fc";
      } else if (["uranus", "neptune"].includes(planetKey)) {
        planetType = "Ice Giant";
        badgeBackground = "#3b82f680";
        badgeTextColor = "#60a5fa";
      }

      const rowHighlightClass =
        planetKey === "earth"
          ? "hover:bg-slate-800/30 transition-colors bg-blue-500/5"
          : "hover:bg-slate-800/30 transition-colors";

      return `
        <tr class="${rowHighlightClass}">
          <td class="px-4 md:px-6 py-3 md:py-4 sticky left-0 bg-slate-800 z-10">
            <div class="flex items-center space-x-2 md:space-x-3">
              <div class="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0" style="background-color: ${rowColor}"></div>
              <span class="font-semibold text-sm md:text-base whitespace-nowrap">${planet.englishName}</span>
            </div>
          </td>
          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${distanceInAU}</td>
          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${parseInt(diameterInKm).toLocaleString()}</td>
          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${massComparedToEarth}</td>
          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${orbitalPeriodText}</td>
          <td class="px-4 md:px-6 py-3 md:py-4 text-slate-300 text-sm md:text-base whitespace-nowrap">${moonCount}</td>
          <td class="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
            <span class="px-2 py-1 rounded text-xs" style="background-color: ${badgeBackground}; color: ${badgeTextColor}">
              ${planetType}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}



function showPlanetDetails(planet) {
  const planetKey = planet.englishName.toLowerCase();


  const detailImage = document.getElementById("planet-detail-image");
  if (detailImage) {
    detailImage.src = PLANET_IMAGES[planetKey] || "";
    detailImage.alt = planet.englishName;
  }

  const detailName = document.getElementById("planet-detail-name");
  if (detailName) {
    detailName.textContent = planet.englishName;
  }


  const description = getPlanetDescription(planet);
  const detailDescription = document.getElementById(
    "planet-detail-description",
  );
  if (detailDescription) {
    detailDescription.textContent = description;
  }


  const distanceInMillionKm = (planet.semimajorAxis / 1e6).toFixed(1);
  const meanRadius = planet.meanRadius ? planet.meanRadius.toFixed(0) : "N/A";
  const mass = planet.mass
    ? `${planet.mass.massValue} × 10^${planet.mass.massExponent}`
    : "N/A";
  const density = planet.density ? planet.density.toFixed(2) : "N/A";
  const orbitalPeriod = planet.sideralOrbit
    ? planet.sideralOrbit.toFixed(2)
    : "N/A";
  const rotationPeriod = planet.sideralRotation
    ? planet.sideralRotation.toFixed(2)
    : "N/A";
  const moonCount = planet.moons ? planet.moons.length : 0;
  const gravity = planet.gravity ? planet.gravity.toFixed(2) : "N/A";

  setTextIfExists("planet-distance", `${distanceInMillionKm}M km`);
  setTextIfExists("planet-radius", `${meanRadius} km`);
  setTextIfExists("planet-mass", `${mass} kg`);
  setTextIfExists("planet-density", `${density} g/cm³`);
  setTextIfExists(
    "planet-orbital-period",
    orbitalPeriod === "N/A" ? "N/A" : `${orbitalPeriod} days`,
  );
  setTextIfExists(
    "planet-rotation",
    rotationPeriod === "N/A" ? "N/A" : `${rotationPeriod} hours`,
  );
  setTextIfExists("planet-moons", moonCount);
  setTextIfExists(
    "planet-gravity",
    gravity === "N/A" ? "N/A" : `${gravity} m/s²`,
  );


  setTextIfExists(
    "planet-discoverer",
    planet.discoveredBy || "Known since antiquity",
  );
  setTextIfExists(
    "planet-discovery-date",
    planet.discoveryDate || "Ancient times",
  );
  setTextIfExists("planet-body-type", planet.bodyType || "Planet");

  const volumeText = planet.vol
    ? `${planet.vol.volValue} × 10^${planet.vol.volExponent} km³`
    : "N/A";
  setTextIfExists("planet-volume", volumeText);


  const perihelionText = planet.perihelion
    ? `${(planet.perihelion / 1e6).toFixed(1)}M km`
    : "N/A";
  const aphelionText = planet.aphelion
    ? `${(planet.aphelion / 1e6).toFixed(1)}M km`
    : "N/A";
  const eccentricityText = planet.eccentricity
    ? planet.eccentricity.toFixed(5)
    : "N/A";
  const inclinationText = planet.inclination
    ? `${planet.inclination.toFixed(2)}°`
    : "N/A";
  const axialTiltText = planet.axialTilt
    ? `${planet.axialTilt.toFixed(2)}°`
    : "N/A";
  const avgTempText = planet.avgTemp ? `${planet.avgTemp}°C` : "N/A";
  const escapeVelocityText = planet.escape
    ? `${(planet.escape / 1e3).toFixed(2)} km/s`
    : "N/A";

  setTextIfExists("planet-perihelion", perihelionText);
  setTextIfExists("planet-aphelion", aphelionText);
  setTextIfExists("planet-eccentricity", eccentricityText);
  setTextIfExists("planet-inclination", inclinationText);
  setTextIfExists("planet-axial-tilt", axialTiltText);
  setTextIfExists("planet-temp", avgTempText);
  setTextIfExists("planet-escape", escapeVelocityText);


  const quickFacts = getPlanetQuickFacts(planet);
  const factsList = document.getElementById("planet-facts");
  if (factsList) {
    factsList.innerHTML = quickFacts
      .map(
        (fact) => `
          <li class="flex items-start">
            <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
            <span class="text-slate-300">${fact}</span>
          </li>
        `,
      )
      .join("");
  }
}


function setTextIfExists(elementId, text) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = text;
  }
}


function getPlanetDescription(planet) {
  const descriptions = {
    earth:
      "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth's surface is land consisting of continents and islands. The remaining 71% is covered with water.",
    mars: 'Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. Named after the Roman god of war, it is often referred to as the "Red Planet" due to its reddish appearance.',
    jupiter:
      "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets combined.",
    saturn:
      "Saturn is the sixth planet from the Sun and the second-largest in the Solar System. It is a gas giant with an average radius about nine times that of Earth, and is best known for its extensive ring system.",
    venus:
      "Venus is the second planet from the Sun. It is named after the Roman goddess of love and beauty. As the second-brightest natural object in the night sky after the Moon, Venus can cast shadows.",
    mercury:
      "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the planets in the Solar System.",
    uranus:
      "Uranus is the seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System. Uranus is unique in that it rotates on its side.",
    neptune:
      "Neptune is the eighth and farthest known planet from the Sun in the Solar System. It is the fourth-largest planet by diameter and the third-most-massive planet.",
  };

  const planetKey = planet.englishName.toLowerCase();
  return (
    descriptions[planetKey] ||
    `${planet.englishName} is a fascinating celestial body in our Solar System with unique characteristics.`
  );
}


function getPlanetQuickFacts(planet) {
  const facts = [];

  if (planet.mass) {
    facts.push(
      `Mass: ${planet.mass.massValue} × 10^${planet.mass.massExponent} kg`,
    );
  }
  if (planet.gravity) {
    facts.push(`Surface gravity: ${planet.gravity} m/s²`);
  }
  if (planet.density) {
    facts.push(`Density: ${planet.density} g/cm³`);
  }
  if (planet.axialTilt) {
    facts.push(`Axial tilt: ${planet.axialTilt}°`);
  }
  if (planet.discoveredBy) {
    facts.push(`Discovered by: ${planet.discoveredBy}`);
  }


  if (facts.length < 3) {
    facts.push(`Mean radius: ${planet.meanRadius.toFixed(0)} km`);
    if (planet.moons) {
      facts.push(`Has ${planet.moons.length} moon(s)`);
    }
  }

  return facts.slice(0, 4);
}



function setupDateInputControls() {
  const dateInput = document.getElementById("apod-date-input");
  if (!dateInput) {
    console.error("Date input not found");
    return;
  }

  const dateInputWrapper = dateInput.closest(".date-input-wrapper");
  const loadDateButton = document.getElementById("load-date-btn");
  const todayButton = document.getElementById("today-apod-btn");

  if (!dateInputWrapper || !loadDateButton || !todayButton) {
    console.error("Date input elements not found", {
      dateWrapper: dateInputWrapper,
      loadBtn: loadDateButton,
      todayBtn: todayButton,
    });
    return;
  }

  const todayAsString = formatDateAsYYYYMMDD(new Date());
  dateInput.max = todayAsString;
  dateInput.value = todayAsString;


  function updateDateLabel(dateString) {
    if (dateString) {
      const niceDate = new Date(dateString + "T00:00:00").toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        },
      );
      dateInputWrapper.setAttribute("data-date", niceDate);
    } else {
      dateInputWrapper.setAttribute("data-date", "Select a date");
    }
  }

  updateDateLabel(todayAsString);

  dateInput.addEventListener("change", () => {
    updateDateLabel(dateInput.value);
  });

  loadDateButton.addEventListener("click", () => {
    const chosenDate = dateInput.value;
    if (chosenDate) {
      loadAstronomyPictureOfTheDay(chosenDate);
    }
  });

  todayButton.addEventListener("click", () => {
    dateInput.value = todayAsString;
    updateDateLabel(todayAsString);
    loadAstronomyPictureOfTheDay(null);
  });

  dateInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      const chosenDate = dateInput.value;
      if (chosenDate) {
        loadAstronomyPictureOfTheDay(chosenDate);
      }
    }
  });

 
  function formatDateAsYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}



function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".app-section");

  function showSection(sectionName) {
 
    sections.forEach((section) => {
      section.classList.add("hidden");
    });


    document
      .querySelectorAll(`[data-section="${sectionName}"]`)
      .forEach((section) => {
        section.classList.remove("hidden");
      });

   
    navLinks.forEach((link) => {
      if (link.dataset.section === sectionName) {
        link.classList.remove("text-slate-300", "hover:bg-slate-800");
        link.classList.add("bg-blue-500/10", "text-blue-400");
      } else {
        link.classList.remove("bg-blue-500/10", "text-blue-400");
        link.classList.add("text-slate-300", "hover:bg-slate-800");
      }
    });

    window.scrollTo(0, 0);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const sectionName = this.dataset.section;
      showSection(sectionName);
      closeSidebar();
    });
  });

 
  showSection("today-in-space");
}


function setupSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggleButton = document.getElementById("sidebar-toggle");
  let overlayElement = null;

  if (!sidebar || !sidebarToggleButton) return;

  function openSidebar() {
    sidebar.classList.add("sidebar-open");

    if (!overlayElement) {
      overlayElement = document.createElement("div");
      overlayElement.className = "sidebar-overlay";
      overlayElement.addEventListener("click", closeSidebar);
      document.body.appendChild(overlayElement);
    }
  }

  function closeSidebar() {
    sidebar.classList.remove("sidebar-open");
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
    }
  }

  sidebarToggleButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (sidebar.classList.contains("sidebar-open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });


  window.closeSidebar = closeSidebar;
}


window.addEventListener("load", function () {
  setupNavigation();
  setupSidebarToggle();
  setupDateInputControls();
  loadAstronomyPictureOfTheDay();
  loadPlanetsData();
  loadUpcomingLaunches();
});
